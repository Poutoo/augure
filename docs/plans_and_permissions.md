# Forfaits et gestion des permissions

Ce document décrit l'architecture de la gestion des accès dans Augure : stockage des plans, transport via JWT, application des restrictions côté FastAPI et affichage conditionnel côté Next.js.

---

## 1. Structure des forfaits

L'application propose trois niveaux d'accès :

| Fonctionnalité | Freemium (0 €) | Premium (14,99 €/mois) | Business (89,99 €/mois) |
|---|:---:|:---:|:---:|
| Recherches / jour | **7** | ∞ | ∞ |
| Fiches tendances complètes | — | ✓ | ✓ |
| Tous les filtres | — | ✓ | ✓ |
| Alertes personnalisées | — | ✓ | ✓ |
| Sauvegarde de favoris | — | ✓ | ✓ |
| Export PDF / Excel | — | — | ✓ |
| Dashboard équipe | — | — | ✓ |
| Rapports personnalisés | — | — | ✓ |
| Accès API | — | — | ✓ |
| Communauté | ✓ | ✓ | ✓ |

Cette matrice est définie dans `frontend/app/onboarding/page.tsx` et constitue la référence pour toutes les couches d'enforcement.

---

## 2. Stockage du plan et transport JWT

### 2.1 Champ `plan` en base de données

Le plan de l'utilisateur est stocké directement sur la table `users` :

```python
# backend/app/models.py — ligne 72
plan: Mapped[str] = mapped_column(String(20), nullable=False, server_default="freemium")
```

Les trois valeurs acceptées sont définies dans le schéma de validation :

```python
# backend/app/schemas.py
class PlanRequest(BaseModel):
    plan: Literal["freemium", "premium", "business"]
```

La mise à jour du plan est exposée via `PATCH /user/plan` (protégé par authentification), appelé à la fin du tunnel d'onboarding après la sélection de l'offre.

### 2.2 Token JWT — contenu et limites

Le token JWT généré à la connexion contient uniquement l'identifiant utilisateur et la date d'expiration :

```python
# backend/app/auth/service.py
def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
```

Le plan n'est **pas embarqué dans le token**. Ce choix est intentionnel : si le plan évolue (upgrade, expiration d'abonnement), il n'y a pas besoin d'invalider les tokens existants. Chaque requête authentifiée résout le plan courant en base via la dépendance `get_current_user`.

---

## 3. Couche de restriction backend (FastAPI)

### 3.1 Dépendance `get_current_user`

Toutes les routes protégées reçoivent l'utilisateur résolu via injection de dépendance :

```python
# backend/app/dependencies.py
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user
```

L'objet `User` retourné expose `user.plan`, ce qui permet à n'importe quelle couche aval de brancher une logique de restriction sans modifier la dépendance de base.

> **Note production — cache Redis** : ce choix force un `SELECT` sur `users` à chaque appel d'API protégée. À 1 000 requêtes simultanées, cela représente 1 000 lectures base en parallèle. En production, l'objet `User` serait mis en cache dans Redis avec une clé `user:{user_id}` et un TTL court (5 minutes), aligné sur le TTL du compteur de recherches journalier. Le cache est invalidé immédiatement en cas de changement de plan.

### 3.2 Dépendances de plan — architecture des guards

Le pattern retenu est de composer des dépendances au-dessus de `get_current_user`. Chaque niveau d'accès est une fonction indépendante réutilisable :

```python
# backend/app/dependencies.py — guards de plan

def require_premium(current_user: User = Depends(get_current_user)) -> User:
    if current_user.plan not in ("premium", "business"):
        raise HTTPException(
            status_code=403,
            detail="Cette fonctionnalité est réservée aux abonnés Premium.",
        )
    return current_user

def require_business(current_user: User = Depends(get_current_user)) -> User:
    if current_user.plan != "business":
        raise HTTPException(
            status_code=403,
            detail="Cette fonctionnalité est réservée aux abonnés Business.",
        )
    return current_user
```

Ces dépendances se branchent directement sur la signature des routes :

```python
# Exemple : route réservée Business
@router.get("/trends/export")
def export_trends(current_user: User = Depends(require_business)):
    ...

# Exemple : route réservée Premium+
@router.get("/trends/predictions")
def trend_predictions(current_user: User = Depends(require_premium)):
    ...
```

FastAPI résout la chaîne de dépendances automatiquement : `require_premium` appelle `get_current_user`, qui valide le token et charge l'utilisateur. Si le plan est insuffisant, un `403 Forbidden` est levé avant même d'entrer dans le corps de la route.

### 3.3 Rate limiting — les 7 recherches par jour (Freemium)

La limite de 7 recherches quotidiennes pour les utilisateurs Freemium est implémentée comme une dépendance dédiée. Le compteur est stocké en base dans la table `users` (ou dans un cache Redis en production) et remis à zéro chaque jour.

**Approche par compteur base de données :**

```python
# backend/app/dependencies.py

FREEMIUM_DAILY_LIMIT = 7

def check_search_quota(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.plan != "freemium":
        return current_user  # Pas de limite pour Premium/Business

    today = date.today()
    # Compte les appels à /trends/list ou /trends/recommend aujourd'hui
    count = (
        db.query(func.count(SearchLog.id))
        .filter(
            SearchLog.user_id == current_user.id,
            func.date(SearchLog.searched_at) == today,
        )
        .scalar()
    )

    if count >= FREEMIUM_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Limite de {FREEMIUM_DAILY_LIMIT} recherches par jour atteinte. Passez en Premium pour un accès illimité.",
        )
    return current_user
```

La route de recherche enregistre chaque appel :

```python
@router.get("/trends/list")
def list_trends(
    current_user: User = Depends(check_search_quota),
    db: Session = Depends(get_db),
):
    # Enregistrer l'appel
    db.add(SearchLog(user_id=current_user.id))
    db.commit()
    return trends_service.get_all_trends(db)
```

En production, ce compteur migre vers **Redis** avec un TTL de 86 400 secondes (24h) pour éviter une écriture base à chaque requête. La clé est du type `search_count:{user_id}:{date}`.

---

## 4. Affichage conditionnel côté Next.js

### 4.1 Middleware de session — protection des routes

Le middleware Next.js protège les routes authentifiées en vérifiant la présence du cookie de session :

```typescript
// frontend/middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get("augure_session");
  if (!session) {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/search", "/glossary", "/profile"],
};
```

Ce guard de premier niveau bloque les utilisateurs non connectés. Il ne vérifie pas le plan — c'est délibéré : la session confirme l'identité, pas les droits.

### 4.2 Résolution du plan côté client

Le plan est résolu en appelant l'API profil après login. Le token JWT est stocké dans `localStorage` :

```typescript
// frontend/app/login/page.tsx
localStorage.setItem("augure_token", data.access_token);
document.cookie = "augure_session=1; path=/; max-age=86400";
```

Puis sur chaque page protégée, le plan est lu depuis le profil utilisateur :

```typescript
// Exemple dans n'importe quelle page
const token = localStorage.getItem("augure_token");
const user = await apiGetProfile(token);  // retourne user.plan
```

### 4.3 Affichage conditionnel basé sur le plan

Le composant de profil affiche le badge du plan de l'utilisateur :

```typescript
// frontend/app/profile/page.tsx — lignes 305-310
const PLAN_LABELS: Record<string, string> = {
  freemium: "Freemium",
  premium: "Premium",
  business: "Business",
};

const planBadgeClass =
  user.plan === "business" ? "bg-gray-800 text-white" :
  user.plan === "premium"  ? "bg-[var(--color-text-dark)] text-white" :
                             "bg-gray-100 text-gray-600";
```

Pour les fonctionnalités gatées, le pattern de guard conditionnel est le suivant :

```tsx
// Pattern de restriction UI selon le plan
function PremiumFeature({ user, children }: { user: ApiUser; children: ReactNode }) {
  if (user.plan === "freemium") {
    return (
      <div className="relative opacity-50 pointer-events-none">
        {children}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-syne font-bold text-sm bg-black text-white px-3 py-1 rounded-full">
            Premium
          </span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
```

### 4.4 Sécurité : le frontend n'est pas la ligne de défense

L'affichage conditionnel est une **amélioration UX**, pas une mesure de sécurité. Un utilisateur Freemium qui désactive JavaScript ou qui appelle l'API directement contourne tous les guards frontend. La seule ligne de défense fiable est le backend via les dépendances FastAPI (`require_premium`, `check_search_quota`).

Ce principe est fondamental dans toute architecture client-serveur : le client affiche, le serveur décide.

---

## 5. Flux complet — de la connexion à la restriction

```
1. Connexion
   POST /auth/login → JWT(sub=user_id) → localStorage + cookie session

2. Requête protégée
   GET /trends/recommend
   Authorization: Bearer <jwt>
         │
         ▼
   get_current_user()          ← décode JWT, charge User depuis DB
         │
         ▼
   check_search_quota()        ← vérifie plan == "freemium" et compteur daily
         │
   ┌─────┴──────┐
   │ quota OK   │ quota dépassé
   ▼            ▼
service()    HTTP 429 + message upgrade

3. Affichage
   Frontend lit user.plan → masque / grise les features non accessibles
   Backend est la source de vérité — le frontend ne peut pas être contourné
```
