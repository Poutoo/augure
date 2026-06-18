# Base de données — Analyse technique

Ce document détaille la conception relationnelle de la base de données PostgreSQL d'Augure : dictionnaire des tables, contraintes d'intégrité et stratégie d'indexation.

---

## 1. Vue d'ensemble du schéma

Le schéma repose sur **13 tables** organisées en trois domaines fonctionnels :

- **Utilisateurs** : `users`, `interests`, `user_interests`
- **Tendances** : `trends`, `trend_tags`, `trends_snapshots`, `banned_hashtags`
- **Communauté** : `threads`, `comments`, `likes`, `favorite_collections`, `favorite_items`
- **Monitoring** : `search_logs`

```
users ──────────────────────────────────────────────────┐
  │                                                      │
  ├─< user_interests >── interests                       │
  │                                                      │
  ├─< threads ────────────── trend (nullable) ──< trends │
  │       └─< comments ──────────────────────────────────┘
  │               └─< comments (parent_comment_id)   [auto-référence]
  │
  ├─< likes ──── thread_id | comment_id             [polymorphisme]
  │
  └─< favorite_collections
          └─< favorite_items ── trend_id | thread_id [polymorphisme]
```

---

## 2. Dictionnaire des tables

### `users`
Table centrale. Chaque utilisateur possède un profil d'audience (JSON) utilisé par le moteur de recommandation.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK, default `uuid4` | Identifiant universel |
| `email` | `VARCHAR(254)` | UNIQUE, NOT NULL, **INDEX** | Adresse email de connexion |
| `hashed_password` | `VARCHAR(255)` | NOT NULL | Hash bcrypt du mot de passe |
| `username` | `VARCHAR(100)` | UNIQUE, nullable | Nom d'affichage public |
| `plan` | `VARCHAR(20)` | NOT NULL, default `freemium` | Plan tarifaire (`freemium`, `pro`) |
| `role` | `ENUM(user_role)` | nullable | Rôle professionnel (community manager, agence…) |
| `target_ages` | `JSON` | nullable | Tranches d'âge ciblées ex: `["18-24", "25-34"]` |
| `target_networks` | `JSON` | nullable | Réseaux ciblés ex: `["tiktok", "instagram"]` |
| `target_geography` | `JSON` | nullable | Zones géographiques ciblées |
| `target_gender` | `VARCHAR(20)` | nullable | Genre de l'audience cible |
| `avatar_url` | `TEXT` | nullable | URL de l'avatar |
| `is_verified` | `BOOLEAN` | NOT NULL, default `false` | Badge de certification |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Date de création |

---

### `interests`
Référentiel des centres d'intérêt disponibles à l'onboarding.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `INTEGER` | PK, autoincrement | Identifiant |
| `name` | `VARCHAR(100)` | NOT NULL | Libellé affiché (ex: "Mode") |
| `slug` | `VARCHAR(100)` | UNIQUE, NOT NULL, **INDEX** | Identifiant sémantique (ex: `mode`) |

---

### `user_interests` *(table d'association)*
Table de jointure many-to-many entre `users` et `interests`. Elle n'a pas de colonne `id` propre : la clé primaire **composite** `(user_id, interest_id)` garantit à elle seule l'unicité — un utilisateur ne peut pas avoir deux fois le même intérêt.

```sql
CREATE TABLE user_interests (
    user_id     UUID    REFERENCES users(id)     ON DELETE CASCADE,
    interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);
```

La suppression en cascade (`ON DELETE CASCADE`) garantit que si un utilisateur est supprimé, toutes ses associations d'intérêts sont automatiquement nettoyées — sans trigger ni logique applicative.

---

### `trends`
Table principale du contenu éditorial. Chaque ligne représente une tendance culturelle.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `slug` | `VARCHAR(255)` | UNIQUE, NOT NULL, **INDEX** | Identifiant URL (ex: `quiet-luxury`) |
| `title` | `VARCHAR(200)` | NOT NULL | Titre de la tendance |
| `description` | `TEXT` | NOT NULL | Description courte |
| `context` | `TEXT` | NOT NULL | Analyse contextuelle |
| `usage_example` | `TEXT` | NOT NULL | Exemple d'usage |
| `usage_keys` | `JSON` | nullable | Points clés structurés |
| `score_base` | `INTEGER` | NOT NULL, default `0` | Score éditorial brut |
| `status` | `ENUM(trend_status)` | NOT NULL | État (`viral`, `emergent`, `en_hausse`, `stable`, `en_baisse`) |
| `category` | `VARCHAR(50)` | nullable, **INDEX** | Catégorie (mode, tech, food…) |
| `region` | `VARCHAR(100)` | nullable | Zone géographique principale |
| `age_range` | `VARCHAR(50)` | nullable | Tranche d'âge cible |
| `image_url` | `VARCHAR(500)` | nullable | Illustration |
| `platforms` | `JSON` | nullable | Plateformes concernées |
| `badges` | `JSON` | nullable | Badges éditoriaux |
| `extra_stats` | `JSON` | nullable | Statistiques complémentaires |
| `rank` | `INTEGER` | nullable, **INDEX** | Rang éditorial pour le tri |
| `weak_signals_hashtags` | `JSON` | nullable | Hashtags signaux faibles |
| `weak_signals_music` | `JSON` | nullable | Musiques signaux faibles |
| `age_distribution` | `JSON` | nullable | Répartition démographique |
| `original_post_at` | `TIMESTAMPTZ` | nullable | Date de première apparition |
| `is_mock` | `BOOLEAN` | NOT NULL, default `false` | Données de démo affichées dans l'app |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Date d'insertion |

---

### `trend_tags`
Table de tags typés qui rattachent une tendance à des critères de matching utilisateur. Le moteur de recommandation interroge cette table pour calculer un score d'affinité.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `INTEGER` | PK, autoincrement | Identifiant |
| `trend_id` | `UUID` | FK → `trends.id` CASCADE, **INDEX** | Tendance associée |
| `tag_type` | `ENUM(tag_type)` | NOT NULL | Type : `interest`, `generation`, `role` |
| `value` | `VARCHAR(100)` | NOT NULL | Valeur ex: `mode`, `18-24`, `community_manager` |

Exemple de lignes pour une même tendance :

```
trend_id=X | INTEREST   | "mode"
trend_id=X | GENERATION | "18-24"
trend_id=X | ROLE       | "content_creator"
```

---

### `trends_snapshots`
Historique des vues par tendance. Permet de tracer l'évolution de la popularité dans le temps.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `trend_id` | `UUID` | FK → `trends.id` CASCADE, **INDEX** | Tendance référencée |
| `views_count` | `BIGINT` | NOT NULL | Nombre de vues à l'instant `t` |
| `recorded_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Horodatage du snapshot |

> **Note de conception** : La FK pointe vers `trends.id` (UUID, clé primaire immuable) et non vers `trends.slug` (VARCHAR, mutable). Un slug peut être modifié sans casser l'historique des snapshots.

---

### `banned_hashtags`
Liste noire des hashtags exclus du scraping. La clé primaire est directement le `tag` (pas d'UUID), ce qui rend les lookups O(log n) sans index secondaire.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `tag` | `VARCHAR(100)` | PK | Hashtag banni |
| `reason` | `VARCHAR(50)` | nullable | Motif : `algorithme`, `temporel`, `macro`, `format` |
| `added_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | Date d'ajout |

---

### `search_logs`
Table de monitoring technique utilisée par le rate limiter pour compter les appels quotidiens des utilisateurs Freemium. Elle n'est pas exposée à l'application cliente — c'est une table d'infrastructure.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK, default `uuid4` | Identifiant |
| `user_id` | `UUID` | FK → `users.id` CASCADE, **INDEX** | Utilisateur ayant effectué la recherche |
| `searched_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`, **INDEX** | Horodatage de la recherche |

L'index sur `searched_at` est essentiel : la requête de comptage filtre systématiquement sur `date(searched_at) = today`, et sans index un full scan serait effectué à chaque appel.

```sql
-- Requête exécutée par check_search_quota()
SELECT COUNT(id) FROM search_logs
WHERE user_id = $1
  AND DATE(searched_at) = CURRENT_DATE;
```

En production, ce compteur migre vers Redis (`search_count:{user_id}:{date}`, TTL 86 400 s) pour éliminer les écritures base à chaque requête.

---

### `threads`
Fils de discussion du forum communautaire. Un thread peut être associé optionnellement à une tendance (`trend_id` nullable).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `author_id` | `UUID` | FK → `users.id` CASCADE, **INDEX** | Auteur |
| `trend_id` | `UUID` | FK → `trends.id` SET NULL, **INDEX**, nullable | Tendance liée |
| `title` | `VARCHAR(300)` | NOT NULL | Titre du fil |
| `body` | `TEXT` | NOT NULL | Contenu |
| `is_pinned` | `BOOLEAN` | NOT NULL, default `false` | Épinglage modération |
| `is_locked` | `BOOLEAN` | NOT NULL, default `false` | Verrouillage modération |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, géré par l'ORM | Mis à jour automatiquement |

La FK sur `trend_id` utilise `ON DELETE SET NULL` plutôt que `CASCADE` : si une tendance est supprimée, les threads restent accessibles dans le forum (le lien est simplement rompu).

---

### `comments`
Commentaires sur les threads **et** sur les tendances directement. La colonne `parent_comment_id` crée une **auto-référence** permettant des arbres de réponses imbriqués.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `author_id` | `UUID` | FK → `users.id` CASCADE, **INDEX** | Auteur |
| `thread_id` | `UUID` | FK → `threads.id` CASCADE, **INDEX**, nullable | Thread parent |
| `trend_id` | `UUID` | FK → `trends.id` CASCADE, **INDEX**, nullable | Tendance parente |
| `parent_comment_id` | `UUID` | FK → `comments.id` CASCADE, **INDEX**, nullable | Commentaire parent (réponse) |
| `body` | `TEXT` | NOT NULL | Contenu |
| `is_deleted` | `BOOLEAN` | NOT NULL, default `false` | Soft delete (contenu masqué mais nœud conservé) |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, géré par l'ORM | — |

L'auto-référence `parent_comment_id → comments.id` modélise un arbre de commentaires à profondeur arbitraire. Le soft delete (`is_deleted = true`) préserve la structure de l'arbre même quand un nœud intermédiaire est supprimé.

---

### `favorite_collections`
Collections personnelles de l'utilisateur (comme des dossiers).

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `user_id` | `UUID` | FK → `users.id` CASCADE, **INDEX** | Propriétaire |
| `name` | `VARCHAR(100)` | NOT NULL | Nom de la collection |
| `emoji` | `VARCHAR(10)` | NOT NULL, default `🔖` | Icône de la collection |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |

---

### `favorite_items`
Éléments dans une collection. La table est **polymorphique** : un item peut être une tendance (`trend_id`) ou un thread (`thread_id`), les deux colonnes étant nullable. Les contraintes d'unicité empêchent les doublons au sein d'une collection.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `collection_id` | `UUID` | FK → `favorite_collections.id` CASCADE, **INDEX** | Collection parente |
| `thread_id` | `UUID` | FK → `threads.id` CASCADE, nullable | Thread favori |
| `trend_id` | `UUID` | FK → `trends.id` CASCADE, nullable | Tendance favorite |
| `added_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |

Contraintes d'unicité :

```sql
UNIQUE (collection_id, thread_id)  -- uq_favitem_col_thread
UNIQUE (collection_id, trend_id)   -- uq_favitem_col_trend
```

---

### `likes`
Likes sur les threads et les commentaires. Même pattern **polymorphique** que `favorite_items`.

| Colonne | Type | Contraintes | Description |
|---|---|---|---|
| `id` | `UUID` | PK | Identifiant |
| `user_id` | `UUID` | FK → `users.id` CASCADE, **INDEX** | Utilisateur |
| `thread_id` | `UUID` | FK → `threads.id` CASCADE, nullable | Thread liké |
| `comment_id` | `UUID` | FK → `comments.id` CASCADE, nullable | Commentaire liké |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `now()` | — |

---

## 3. Contraintes d'unicité

Les contraintes d'unicité composite constituent la première ligne de défense contre les doublons, indépendamment de la couche applicative.

| Nom de la contrainte | Table | Colonnes | Rôle |
|---|---|---|---|
| `uq_like_user_thread` | `likes` | `(user_id, thread_id)` | Interdit à un utilisateur de liker deux fois le même thread |
| `uq_like_user_comment` | `likes` | `(user_id, comment_id)` | Interdit de liker deux fois le même commentaire |
| `uq_favitem_col_thread` | `favorite_items` | `(collection_id, thread_id)` | Interdit d'ajouter le même thread deux fois dans une collection |
| `uq_favitem_col_trend` | `favorite_items` | `(collection_id, trend_id)` | Interdit d'ajouter la même tendance deux fois dans une collection |
| PK composite | `user_interests` | `(user_id, interest_id)` | Interdit d'associer deux fois le même intérêt à un utilisateur |

Ces contraintes sont déclarées directement dans SQLAlchemy via `UniqueConstraint` et se traduisent en `UNIQUE INDEX` PostgreSQL. Elles garantissent l'idempotence des opérations toggle (like/unlike, add/remove) sans nécessiter de `SELECT` préalable.

---

## 4. Stratégie d'indexation

### Index B-tree en place

| Table | Colonne(s) | Justification |
|---|---|---|
| `users` | `email` | Lookup à chaque authentification |
| `interests` | `slug` | Résolution des intérêts par identifiant sémantique |
| `trends` | `slug` | Accès par URL (route `/trends/{slug}`) |
| `trends` | `category` | Filtrage par catégorie sur la page d'accueil et l'explorateur |
| `trends` | `rank` | Tri éditorial `ORDER BY rank ASC NULLS LAST` |
| `trend_tags` | `trend_id` | Jointure dans le moteur de recommandation (agrégation `SUM` par trend) |
| `trends_snapshots` | `trend_id` | Requêtes historiques par tendance |
| `threads` | `author_id`, `trend_id` | Filtrage des fils par auteur ou par tendance liée |
| `comments` | `author_id`, `thread_id`, `trend_id`, `parent_comment_id` | Navigation dans l'arbre de commentaires |
| `favorite_collections` | `user_id` | Chargement des collections d'un utilisateur |
| `favorite_items` | `collection_id` | Chargement des items d'une collection |
| `likes` | `user_id` | Vérification des likes d'un utilisateur |

### Cas particulier : recherche textuelle (`ILIKE`)

La recherche textuelle sur les tendances utilise actuellement :

```sql
WHERE title ILIKE '%query%' OR description ILIKE '%query%'
```

Un prédicat avec `%` **en tête de chaîne** ne peut pas utiliser un index B-tree standard — PostgreSQL effectue un sequential scan. Pour les volumes actuels (données de démo, `is_mock = true`), ce comportement est acceptable.

Pour une mise en production à grande échelle, l'optimisation recommandée est un index **GIN** avec l'extension `pg_trgm` :

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_trends_title_trgm       ON trends USING GIN (title gin_trgm_ops);
CREATE INDEX idx_trends_description_trgm ON trends USING GIN (description gin_trgm_ops);
```

Cet index trigram permet à PostgreSQL d'utiliser un index même pour les patterns `%query%`, réduisant la complexité de O(n) à O(log n) sur des tables volumineuses.

---

## 5. Notes techniques complémentaires

### `updated_at` — gestion ORM vs trigger PostgreSQL

Les colonnes `updated_at` présentes dans `threads` et `comments` sont automatiquement mises à jour par SQLAlchemy via `onupdate=func.now()`. Ce mécanisme est **applicatif** : la valeur est calculée côté Python et incluse dans la requête `UPDATE`.

PostgreSQL ne propose pas de syntaxe `ON UPDATE` native sur une colonne. Si une mise à jour directe en base (hors ORM) est nécessaire, il faut un trigger explicite :

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_threads_updated_at
    BEFORE UPDATE ON threads
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Enums PostgreSQL — valeurs déclarées

L'enum `user_role` couvre l'intégralité des rôles proposés dans le tunnel d'onboarding :

| Valeur SQL | Libellé affiché |
|---|---|
| `community_manager` | Community Manager |
| `agence` | Agence |
| `influenceur` | Influenceur |
| `content_creator` | Content Creator |
| `parent` | Parent |
| `teacher` | Enseignant |
| `autre` | Autre |

L'enum `trend_status` couvre les cinq états possibles d'une tendance : `viral`, `emergent`, `en_hausse`, `stable`, `en_baisse`.

L'enum `tag_type` distingue trois catégories de tags de matching : `interest`, `generation`, `role`.
