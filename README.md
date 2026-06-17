# Augure — Moteur d'Analyse Culturelle Intergénérationnel

> *« Lire les signes que personne ne regarde encore »*

![Stack](https://img.shields.io/badge/Frontend-Next.js%2016%20%2F%20TypeScript-black?logo=next.js)
![Stack](https://img.shields.io/badge/Backend-FastAPI%20%2F%20Python%203.12-009688?logo=fastapi)
![Stack](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Supabase-4169E1?logo=postgresql)
![Stack](https://img.shields.io/badge/ORM-SQLAlchemy%202%20%2B%20Alembic-red)
![Stack](https://img.shields.io/badge/Containerisation-Docker%20Compose-2496ED?logo=docker)

Projet développé dans le cadre de la Compétition B3 2026 — Digital Campus Paris.

---

## Table des matières

1. [Contexte produit](#1-contexte-produit)
2. [Architecture technique](#2-architecture-technique)
3. [Structure du dépôt](#3-structure-du-dépôt)
4. [Modèle de données](#4-modèle-de-données)
5. [API Reference](#5-api-reference)
6. [Fonctionnalités implémentées](#6-fonctionnalités-implémentées)
7. [Installation et configuration](#7-installation-et-configuration)
8. [Lancement en local](#8-lancement-en-local)
9. [Ingestion de données](#9-ingestion-de-données)
10. [Retour d'expérience (REX)](#10-retour-dexperience)
11. [Équipe](#11-equipe)

---

## 1. Contexte produit

**Cible** : Adultes de plus de 45 ans — managers, parents, décideurs — confrontés au fossé culturel généré par l'accélération des micro-tendances issues des réseaux sociaux (Gen Z / Alpha).

**Problème** : L'étanchéité des bulles algorithmiques et l'obsolescence éclair des codes culturels créent une anxiété d'exclusion sociale et une perte de capital culturel lors d'interactions professionnelles ou quotidiennes.

**Solution** : Augure est un moteur d'analyse et d'interprétation culturelle. Il ne liste pas les tendances — il les vulgarise, les contextualise et fournit des clés d'usage concrètes pour permettre à sa cible de participer activement aux dynamiques collectives sans paraître décalée.

---

## 2. Architecture technique

### Classification architecturale

| Dimension | Pattern retenu | Ce que ce n'est PAS |
| :--- | :--- | :--- |
| Style global | **Architecture 3-Tiers** | ~~Monolithe fullstack~~ |
| Pattern backend | **Monolithe modulaire** | ~~Microservices~~ |
| Topologie de déploiement | **Multi-conteneurs Docker Compose** | ~~Orchestration Kubernetes~~ |
| Gestion des données | **Base de données partagée (single DB)** | ~~Database-per-service~~ |
| Communication inter-services | **REST synchrone (HTTP/JSON)** | ~~Event bus / message broker~~ |

#### Architecture 3-Tiers

```
┌─────────────────────────────────────────────────────────┐
│  Tier 1 — Présentation                                  │
│  Next.js 16  ·  SSR  ·  App Router  ·  Tailwind CSS    │
│  Déployé sur Vercel (Edge Network)                      │
└────────────────────────┬────────────────────────────────┘
                         │ REST HTTP/JSON  /api/v1
┌────────────────────────▼────────────────────────────────┐
│  Tier 2 — Application                                   │
│  FastAPI  ·  Uvicorn ASGI  ·  JWT Auth                  │
│  Monolithe modulaire (7 domaines métier)                │
└────────────────────────┬────────────────────────────────┘
                         │ SQLAlchemy (pool TCP)
┌────────────────────────▼────────────────────────────────┐
│  Tier 3 — Données                                       │
│  PostgreSQL 15  ·  Supabase (prod) / Docker (local)     │
│  Schéma versionné via Alembic                           │
└─────────────────────────────────────────────────────────┘
         ▲
         │ SQL direct (INSERT / ON CONFLICT) — bypass API
┌────────┴───────────────────────────────────────────────┐
│  Service d'ingestion indépendant                       │
│  Scraper Python  ·  EnsembleData API  ·  planifié 04h  │
└────────────────────────────────────────────────────────┘
```

#### Monolithe modulaire (backend)

Le backend FastAPI est un **monolithe modulaire** : un seul processus ASGI Uvicorn, organisé en modules verticaux par domaine métier. Chaque domaine encapsule son propre `router.py` (endpoints HTTP) et `service.py` (logique métier), sans dépendances croisées entre modules. Le `models.py` et le `database.py` sont les seuls artefacts partagés.

```
app/
├── main.py          ← point d'entrée unique, montage des 7 routeurs
├── database.py      ← session factory partagée (1 pool de connexions)
├── models.py        ← tous les modèles ORM dans un module centralisé
├── auth/            ← domaine Auth   (router + service)
├── users/           ← domaine Users  (router + service)
├── trends/          ← domaine Trends (router + service + scoring engine)
├── comments/        ← domaine Comments
├── community/       ← domaine Community (threads)
├── favorites/       ← domaine Favorites
└── likes/           ← domaine Likes
```

> **Pourquoi pas des microservices ?** Les contraintes d'un projet de compétition (délai, équipe de 2 devs, base de données unique Supabase) rendent les microservices contre-productifs : ils ajoutent un overhead de communication réseau, de déploiement et d'observabilité sans bénéfice à cette échelle. Le monolithe modulaire permet une séparation propre des responsabilités tout en restant simple à déployer et à déboguer.

#### Point d'attention : couplage scraper → base de données

Le scraper écrit **directement en base via SQL brut** (`INSERT ... ON CONFLICT`) sans passer par l'API FastAPI. Ce choix est délibéré — il contourne les restrictions d'API des plateformes et évite un aller-retour HTTP — mais introduit un **couplage structurel fort** : toute évolution du schéma `trends` doit être coordonnée entre la migration Alembic et le scraper. Cette dette est acceptable en contexte MVP.

---

### Stack de production

| Couche | Technologie | Version |
| :--- | :--- | :--- |
| Frontend | Next.js (React / TypeScript) | 16.2.6 / React 19 |
| Styling | Tailwind CSS | v4 |
| ORM Frontend | Drizzle ORM + Drizzle Kit | 0.45 / 0.31 |
| Backend | FastAPI (Python) | 0.115.5 |
| Serveur ASGI | Uvicorn | 0.32.1 |
| ORM Backend | SQLAlchemy + Alembic | 2.0.36 / 1.14.0 |
| Base de données | PostgreSQL | 15 (Supabase en production) |
| Auth | python-jose (JWT) + bcrypt | HS256 / RS256-ready |
| Containerisation | Docker + Docker Compose | — |
| Scraping | Python (PRAW, Pytrends) | script indépendant |

### Justifications d'architecture

**Next.js 16 (React / TypeScript)**
Le rendu SSR (Server-Side Rendering) exécute la logique de récupération des données côté serveur, envoyant au client un HTML déjà hydraté. Sur les terminaux mobiles professionnels ou anciens de notre cible 45+, cela réduit significativement le temps d'affichage en limitant le JavaScript exécuté côté client. Le App Router de Next.js 16 permet en outre un découpage fin des composants serveur/client, optimisant la taille des bundles livrés.

**FastAPI (Python 3.12)**
FastAPI repose sur Starlette et est intégralement asynchrone. Ses performances brutes en I/O non-bloquant sont comparables à NodeJS pour les endpoints CRUD, tout en offrant une intégration native avec l'écosystème Python de traitement de données (PRAW pour Reddit, Pytrends, scripts d'enrichissement lexical). La validation automatique des schémas via Pydantic v2 et la génération OpenAPI embarquée éliminent une couche de boilerplate.

**PostgreSQL + SQLAlchemy 2 / Alembic**
PostgreSQL est le choix de persistance relationnelle standard pour les profils utilisateurs complexes, les jointures many-to-many (tags × tendances × intérêts) et les contraintes d'unicité transactionnelles (likes, favoris). SQLAlchemy 2 avec le style `Mapped[T]` apporte un typage statique complet sur les modèles ORM. Alembic assure le versioning incrémental du schéma en production — chaque évolution structurelle est tracée, réversible et déployable sans downtime si les migrations sont rédigées correctement.

> **Note d'architecture (Arbitrage MVP)** : Le backend FastAPI et le frontend Next.js sont des services séparés. Pour des raisons de performance sur les pages statiques non personnalisées (ex : Glossaire), Next.js utilise Drizzle ORM en lecture directe sur Supabase. En revanche, tout le flux personnalisé et scoré passe obligatoirement par l'API REST FastAPI (`/api/v1/trends`) afin de centraliser la logique métier de calcul d'affinité et garantir l'étanchéité du pattern 3-Tiers.

---

## 3. Structure du dépôt

```text
augure/
├── app/                            # Frontend — Next.js 16 (App Router)
│   ├── app/                        # Routes applicatives
│   │   ├── page.tsx                # Accueil — flux de tendances personnalisé
│   │   ├── search/page.tsx         # Moteur de recherche & filtrage multicritères
│   │   ├── glossary/page.tsx       # Glossaire des micro-tendances
│   │   ├── trends/[id]/page.tsx    # Page de détail d'une tendance
│   │   ├── community/              # Forum communautaire (liste + thread [id])
│   │   ├── profile/page.tsx        # Profil utilisateur, likes & collections
│   │   ├── onboarding/page.tsx     # Tunnel de personnalisation du profil
│   │   ├── login/page.tsx          # Authentification
│   │   ├── welcome/page.tsx        # Splash screen d'introduction
│   │   └── layout.tsx              # Layout racine (fonts, metadata, PWA)
│   ├── components/                 # Composants UI réutilisables
│   │   ├── AppShell.tsx            # Shell applicatif (navigation + layout)
│   │   ├── BottomNav.tsx           # Navigation bas de page mobile
│   │   ├── Header.tsx              # En-tête avec barre de recherche
│   │   ├── TopTrendCard.tsx        # Carte tendance "top" (carousel)
│   │   ├── TrendCard.tsx           # Carte tendance standard
│   │   ├── ExplorerTrendCard.tsx   # Carte tendance avec image (page search)
│   │   ├── TrendListItem.tsx       # Item liste compact
│   │   ├── TrendDetailModal.tsx    # Modal détail (bottom sheet mobile / modal PC)
│   │   ├── TrendComments.tsx       # Section commentaires d'une tendance
│   │   ├── SearchBar.tsx           # Barre de recherche centrale
│   │   ├── CollectionPickerSheet.tsx # Sélecteur de collection favori
│   │   ├── LiquidGlassButton.tsx   # Composant bouton glassmorphism
│   │   ├── PageAnimate.tsx         # Wrapper d'animation de page
│   │   └── PageTransition.tsx      # Transitions inter-pages
│   ├── db/                         # Schéma Drizzle ORM + connecteur PostgresJS
│   ├── lib/                        # Utilitaires et helpers partagés
│   ├── public/                     # Assets statiques (SVG, icônes)
│   ├── Dockerfile                  # Image Docker du frontend
│   ├── drizzle.config.ts           # Configuration Drizzle Kit
│   ├── next.config.ts              # Configuration Next.js (PWA, image domains)
│   └── package.json                # Dépendances et scripts npm
│
├── backend/                        # Backend — FastAPI (Python 3.12)
│   ├── app/
│   │   ├── main.py                 # Point d'entrée FastAPI, montage des routeurs
│   │   ├── config.py               # Paramètres Pydantic-Settings (env vars)
│   │   ├── database.py             # Connecteur SQLAlchemy, Session factory
│   │   ├── dependencies.py         # Injection de dépendances (DB, user courant)
│   │   ├── models.py               # Modèles ORM SQLAlchemy (User, Trend, Thread…)
│   │   ├── schemas.py              # Schémas Pydantic de validation I/O
│   │   ├── auth/                   # Authentification JWT (router + service)
│   │   ├── users/                  # CRUD utilisateurs & profil (router + service)
│   │   ├── trends/                 # Tendances + moteur de recommandation (router + service)
│   │   ├── comments/               # Commentaires sur tendances et threads
│   │   ├── community/              # Forum — threads & replies
│   │   ├── favorites/              # Collections de favoris (trends + threads)
│   │   └── likes/                  # Système de likes (threads + commentaires)
│   ├── migrations/                 # Migrations Alembic versionnées
│   │   └── versions/
│   │       ├── ec0f7c9bf290_init.py
│   │       ├── a3f1e8c20d45_add_community_tables.py
│   │       ├── e2b7c3d4f1a8_add_favorite_collections.py
│   │       └── f3daea0ed346_add_avatar_url_to_users.py
│   ├── alembic.ini                 # Configuration Alembic
│   ├── seed.py                     # Seed données utilisateurs et intérêts
│   ├── seed_trends.py              # Seed données de tendances
│   ├── requirements.txt            # Dépendances Python
│   └── Dockerfile                  # Image Docker du backend
│
├── scraper/                        # Service d'ingestion de données (Python)
│   ├── main.py                     # Pipeline de collecte (Reddit PRAW / Pytrends)
│   ├── requirements.txt
│   └── Dockerfile
│
├── scripts/
│   └── trend_enricher.py           # Enrichissement éditorial des tendances en base
│
├── docs/
│   └── benchmark_V1.md             # Analyse comparative des choix de stack
│
├── maquette/                       # Exports visuels Figma (PNG / SVG)
├── docker-compose.yml              # Orchestration multi-services (DB + Front + Scraper)
├── .gitignore
└── README.md
```

---

## 4. Modèle de données

### Entités principales

```
User ─────────────── user_interests (M:M) ─── Interest
  │
  ├── Thread (1:N) ─── Comment (1:N, self-ref replies)
  │       │                 └── Like
  │       └── Like
  │
  └── FavoriteCollection (1:N) ─── FavoriteItem → Trend | Thread

Trend ─── TrendTag (INTEREST | GENERATION | ROLE)
      ─── Thread (1:N)
      ─── Comment (1:N)
```

### Enums SQLAlchemy

| Enum | Valeurs |
| :--- | :--- |
| `UserRole` | `community_manager`, `agence`, `influenceur`, `content_creator`, `parent`, `teacher`, `autre` |
| `TrendStatus` | `viral`, `emergent`, `en_hausse`, `stable`, `en_baisse` |
| `TagType` | `interest`, `generation`, `role` |

### Architecture de Données Hybride (Live / Démo)

La table `Trend` intègre une colonne `is_mock` (booléenne). Cette conception permet d'isoler hermétiquement deux cycles de vie au sein de la même base de données :
- **Les données réelles (`is_mock=false`)** : Insérées en continu par le scraper en arrière-plan avec des slugs techniques (ex: `fashion`).
- **Les données de démonstration (`is_mock=true`)** : Insérées via des scripts de seeding spécifiques (ex: `backend/seed_demo.py`) avec des slugs narratifs et un rendu visuel contrôlé (ex: `matcha-coded`).

L'API backend filtre nativement par ce flag (via le paramètre `only_mock=True` par défaut) pour garantir une interface publique toujours stable et riche.

---

## 5. API Reference

Le backend expose ses routes sous le préfixe `/api/v1`. La documentation interactive est disponible à l'exécution :

- **Swagger UI** : `http://localhost:8000/api/docs`
- **ReDoc** : `http://localhost:8000/api/redoc`
- **Health check** : `GET /health → {"status": "ok"}`

### Routeurs enregistrés

| Préfixe | Module | Description |
| :--- | :--- | :--- |
| `/api/v1/auth` | `auth/router.py` | Inscription, connexion, refresh token JWT |
| `/api/v1/users` | `users/router.py` | Profil utilisateur, onboarding, intérêts |
| `/api/v1/trends` | `trends/router.py` | Flux personnalisé, recherche, détail |
| `/api/v1/comments` | `comments/router.py` | Commentaires sur tendances |
| `/api/v1/community` | `community/router.py` | Threads du forum, réponses |
| `/api/v1/favorites` | `favorites/router.py` | Collections et items favoris |
| `/api/v1/likes` | `likes/router.py` | Likes sur threads et commentaires |

---

## 6. Fonctionnalités implémentées

### 6.1 Tunnel d'onboarding personnalisé

Collecte du profil utilisateur en plusieurs étapes séquentielles :

- **Rôle** : `parent`, `teacher`, `community_manager`, `content_creator`, `agence`, `influenceur`, `autre`
- **Intérêts** : sélection multiple parmi les slugs d'intérêts disponibles (mode, tech, food, sport…)
- **Audience cible** : tranches d'âge (`13-17`, `18-24`, `25-34`, `35-44`, `45-65`, `65-plus`), réseaux (`tiktok`, `instagram`, `youtube`), géographie, genre

Le profil est persisté en base via `PATCH /api/v1/users/me` à chaque étape.

### 6.2 Algorithme de scoring dynamique

Implémenté dans `backend/app/trends/service.py` — `get_personalized_trends()`.

Le calcul d'affinité est effectué en une seule requête SQL via une sous-requête avec `CASE` et `GROUP BY` :

```
affinity_score = score_base
               + Σ tag_score(tag)

tag_score :
  • INTEREST  matching user.interests  → +3 pts
  • GENERATION matching user.target_ages → +2 pts
  • ROLE      matching user.role        → +1 pt
```

Les résultats sont triés par `affinity_score DESC, created_at DESC`. La pagination est assurée via `skip` / `limit`.

> **Invariant** : Le scoring est calculé dynamiquement à chaque requête. Il n'est pas mis en cache en base, ce qui garantit qu'un changement de profil utilisateur est immédiatement reflété sans job de recalcul asynchrone.

### 6.3 Moteur de recherche et filtrage

`GET /api/v1/trends` accepte les paramètres de requête suivants :

| Paramètre | Type | Description |
| :--- | :--- | :--- |
| `q` | `string` | Recherche full-text sur `title` et `description` (ILIKE) |
| `category` | `string` | Filtrage exact par catégorie (ILIKE) |
| `skip` | `int` | Offset de pagination |
| `limit` | `int` | Nombre de résultats (défaut : 20) |

Tri en l'absence d'utilisateur authentifié : `rank ASC NULLS LAST`, puis `score_base DESC`, puis `created_at DESC`.

### 6.4 Forum communautaire

Système de threads libres non restreint par plan tarifaire :

- Création de threads optionnellement liés à une tendance (`trend_id nullable`)
- Commentaires threadés avec support des réponses imbriquées (auto-référence `parent_comment_id`)
- Soft delete sur les commentaires (`is_deleted = true`, corps masqué)
- Épinglage et verrouillage de threads (`is_pinned`, `is_locked`)

### 6.5 Système de likes et collections de favoris

- **Likes** : contraintes d'unicité DB (`uq_like_user_thread`, `uq_like_user_comment`) — un utilisateur ne peut liker qu'une fois
- **FavoriteCollection** : collections nommées avec emoji, appartenant à un utilisateur
- **FavoriteItem** : entrée polymorphe pointant vers une `Trend` ou un `Thread` avec contraintes d'unicité par collection

### 6.6 Ingestion hybride de données

Deux mécanismes coexistent :

1. **Scraper Python dockerisé** (`scraper/`) : collecte via PRAW (Reddit) et Pytrends pour les signaux faibles en temps réel
2. **Scripts d'enrichissement éditorial** (`backend/seed_trends.py`, `scripts/trend_enricher.py`) : import de structures JSON (TikTok, Instagram) et enrichissement manuel, permettant de contourner proprement les restrictions d'API des plateformes

---

## 7. Installation et configuration

### 7.1 Prérequis

- Node.js ≥ 20
- Python 3.12
- PostgreSQL 15 (ou compte Supabase)
- Docker & Docker Compose (optionnel, pour la méthode conteneurisée)

### 7.2 Variables d'environnement — Backend

Créer `backend/.env` :

```env
# PostgreSQL — remplacer par les valeurs Supabase ou locales
DATABASE_URL="postgresql://postgres:password@localhost:5432/augure_db"

# JWT
SECRET_KEY="remplacer-par-une-chaine-aleatoire-longue-et-securisee"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Supabase (optionnel — requis pour les uploads d'avatar via Storage)
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SERVICE_KEY="<service_role_key>"
```

### 7.3 Variables d'environnement — Frontend

Créer `app/.env.local` (le `.env.example` fourni sert de base) :

```env
# Connexion directe Supabase pour Drizzle ORM
DATABASE_URL="postgresql://postgres:password@db.<ref>.supabase.co:5432/postgres?sslmode=require"

# URL du backend FastAPI
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 7.4 Variables d'environnement — Docker Compose

Créer `.env` à la racine du dépôt pour Docker Compose :

```env
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=augure_db
DB_PORT=5432
```

---

## 8. Lancement en local

### Méthode A — Docker Compose (recommandé pour évaluation)

Lance en une commande l'ensemble de la stack (PostgreSQL + Frontend + Scraper) :

```bash
# Cloner le dépôt
git clone https://github.com/Poutoo/augure.git
cd augure

# Configurer les variables d'environnement (voir section 7)
cp backend/.env.example backend/.env   # puis éditer

# Construire et démarrer tous les services
docker compose up --build
```

| Service | URL locale |
| :--- | :--- |
| Frontend Next.js | http://localhost:3000 |
| Backend FastAPI | http://localhost:8000 |
| Swagger UI | http://localhost:8000/api/docs |
| PostgreSQL | localhost:5432 |

---

### Méthode B — Lancement individuel

#### Backend FastAPI

```bash
cd backend

# Créer et activer l'environnement virtuel
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Appliquer les migrations Alembic sur la base cible
alembic upgrade head

# (Optionnel) Alimenter la base avec les données initiales
python seed.py
python seed_trends.py

# Lancer le serveur de développement
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

L'API est accessible sur `http://localhost:8000` — Swagger UI sur `http://localhost:8000/api/docs`.

#### Frontend Next.js

```bash
cd app

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur `http://localhost:3000`.

#### Commandes Drizzle ORM (gestion du schéma Supabase)

Ces commandes s'exécutent depuis le dossier `app/` et ciblent la base Supabase configurée dans `.env.local` :

```bash
# Générer les fichiers de migration Drizzle à partir du schéma TypeScript
npm run db:generate

# Pousser directement le schéma vers la base de données (sans fichier de migration)
npm run db:push
```

#### Gestion des migrations Alembic (backend)

```bash
# Créer une nouvelle révision après modification de models.py
alembic revision --autogenerate -m "description_de_la_migration"

# Appliquer toutes les migrations en attente
alembic upgrade head

# Revenir à la révision précédente
alembic downgrade -1

# Afficher l'historique des révisions
alembic history --verbose
```

---

## 9. Ingestion de données

### Scraper Python (Reddit / Pytrends)

Le scraper tourne en service Docker indépendant. Il collecte les signaux faibles depuis Reddit via PRAW et les tendances Google via Pytrends, puis insère les données normalisées en base.

```bash
# Lancer le scraper en autonome
docker compose run --rm scraper

# Ou directement
cd scraper
pip install -r requirements.txt
python main.py
```

### Script d'enrichissement éditorial

```bash
cd scripts
python trend_enricher.py
```

Ce script enrichit les tendances existantes en base avec des données structurées issues de sources externes (JSON TikTok / Instagram exportés manuellement), contournant les restrictions d'API des plateformes.

---

## 10. Retour d'expérience (REX) : Les défis de l'ingestion de données

La construction du moteur d'Augure s'est heurtée à la réalité de l'extraction de données à grande échelle. Guidés par une approche **Lean Startup**, nous avons dû adapter nos ambitions techniques pour livrer un MVP fonctionnel. Voici les principaux défis rencontrés et nos stratégies de pivot.

### Le mur du scraping gratuit et légal
Notre ambition initiale était de scraper plusieurs réseaux (TikTok, Instagram, Reddit) de manière autonome. Nous nous sommes rapidement heurtés aux protections anti-scraping massives (blocages d'IP, shadowbans) et aux restrictions légales, rendant l'écosystème Instagram quasi-impénétrable gratuitement.
**Le Pivot Lean** : Face à l'impossibilité de maintenir un scraper stable gratuitement sans épuiser notre temps de développement, nous avons abandonné la collecte multi-plateformes pour nous concentrer **exclusivement sur TikTok**, véritable vivier des signaux faibles. Pour la collecte, nous nous sommes tournés vers **Ensemble Data** (https://ensembledata.com/), dont l'essai de 7 jours (50 crédits/jour) offrait le meilleur compromis gratuit sur le marché pour valider notre preuve de concept (POC).

### Algorithme de détection des signaux faibles
Disposer de l'API d'Ensemble Data ne suffisait pas : une vidéo virale n'est pas forcément une tendance culturelle. Nous avons dû concevoir notre propre algorithme de qualification (`scraper/main.py`). 
Notre stratégie repose sur :
- **L'analyse de co-occurrences** : Regroupement de hashtags de niche et détection de modèles redondants (clusters) sur des échantillons de vidéos.
- **La matrice de Momentum** : Un calcul de vélocité qui croise le volume de vues avec le taux de croissance (Delta) par rapport à un snapshot historique, distinguant les buzz éphémères des vraies tendances en accélération (`Émergent`, `En hausse`, `Viral`).

### L'IA générative en local pour l'enrichissement éditorial
Les données brutes retournées par TikTok (descriptions chaotiques, pluie de hashtags) n'étaient pas présentables pour notre cible audience.
**La Solution** : Nous avons développé un script local exploitant **Ollama** (modèles LLM open-source exécutés sur nos machines). Le script ingère les métadonnées brutes, les nettoie, et génère les champs qualitatifs d'Augure (`description`, `context`, `usage_example`). Cette approche garantit une interface claire.

### Bilan et Évolutions futures
Cette expérience a été extrêmement formatrice sur la réalité de la Data Engineering. Elle nous a appris qu'un algorithme de prédiction n'est rien sans un accès permanent et qualitatif à la donnée. 
**Vision V2** : Avec un budget dédié, la prochaine évolution logique consistera à souscrire à des accès API officiels multi-plateformes. Cela permettrait d'alimenter une base de données suffisante pour entraîner un algorithme capable d'anticiper la trajectoire d'une tendance pour se rapprocher au plus près de la réalité du marché.

---

## 11. Équipe

| Pôle | Membres |
| :--- | :--- |
| Gestion de projet & Stratégie (MD) | Louis |
| Marketing & Traction (MKTI) | Kelly, Firdaous |
| UX / Product & Research (UXPO) | Aurélien |
| Web Design (WD) | Léa, Aristide |
| Développement & Architecture (DEV) | Mathilde, Thibault |

---

*Compétition B3 2026 — Digital Campus Paris — Groupe 6*
