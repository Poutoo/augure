# 🔮 Augure - Moteur d'Analyse Culturelle Intergénérationnel

> *« Lire les signes que personne ne regarde encore »*  
> Projet développé dans le cadre de la Compétition B3 2026 — Digital Campus Paris.  

---

## 📂 Index de la Documentation (`/docs`)
Pour garantir une lisibilité maximale du dépôt et isoler le code des analyses théoriques, l'ensemble des études comparatives et des spécifications techniques est répertorié dans le dossier parallèle `docs/` :

* [**📊 Benchmark Technique Global (V1)**](./docs/benchmark_V1.md) — Analyse comparative complète et détaillée des choix de stacks (Scraping, Front, Back).
* [**📊 Benchmark Technique V2**](./docs/benchmark_V2.md) - Consolidation du choix pour la mise en place du MVP.
* [**📊 informations MVP**](./docs/information.md) - Informations générales sur le projet concernant les palettes de couleurs et typographie choisis.

---

## 🚀 À propos d'Augure

### Le Problème 
L’étanchéité des bulles algorithmiques et l'obsolescence éclair des micro-tendances créent un fossé de communication massif entre les générations. Ce phénomène génère une anxiété d’exclusion sociale et une perte de crédibilité/capital culturel pour les adultes, managers et décideurs de plus de 45 ans lors des interactions sociales ou professionnelles quotidiennes.

### La Vision & Solution (MVP)
Augure est un moteur d'analyse et d'interprétation culturelle. Notre Web App mobile-first ne se contente pas de lister les tendances de manière brute : elle les **vulgarise, les contextualise et fournit des clés d'usage concrètes** (ex: *« comment placer cette tendance en réunion de manière naturelle »*) pour permettre à notre cible de participer activement aux dynamiques collectives sans paraître décalée.

---

## 🏗️ Architecture Technique Validée (MVP)

Suite à nos benchmarks complets et à notre stratégie de production, le MVP s'articule autour d'une stack hybride performante et légère :

| Brique | Technologie retenue | Justification Lean & Produit |
| :--- | :--- | :--- |
| **Frontend / Web App** | **Next.js 16** (React 19 / TypeScript) | Hébergé sur **Vercel** pour des performances optimales (Edge Network, SSR/SSG réactif). |
| **Styling** | **Tailwind CSS v4** | Design ultra-soigné (Syne & Inter), transitions fluides, glassmorphism, et adaptation mobile-first. |
| **Base de Données** | **PostgreSQL** (Hébergé sur **Supabase**) | Base SQL relationnelle robuste, connectée de manière sécurisée et performante. |
| **ORM & Migrations** | **Drizzle ORM** + **Drizzle Kit** | Gestion du schéma de base de données Typesafe et poussée immédiate des schémas vers Supabase (`db:push`). |
| **Scraper** | **Script Python** (Dockerisé) | Service d'ingestion indépendant programmé pour collecter les signaux faibles et alimenter la base SQL. |

---

## 🔮 Fonctionnalités clés du MVP Actuel

1. **Splash Screen Diagonal d'Introduction (Welcome Shutter) :**
   - Une animation d'accueil vectorielle spectaculaire basée sur le logo `loading.svg` qui se sépare diagonalement (Haut-Gauche / Bas-Droit) avec un chevauchement sub-pixel (`101%`) pour combler l'interstice blanc. Elle s'exécute uniquement à la première entrée sur l'application (mémorisée via `sessionStorage`).
2. **Page d'Accueil Premium :**
   - Top tendances dynamiques avec des cartes sombres et contrastées (`TopTrendCard`), carrousel horizontal tactile, section ciblée "Pour votre audience" et boutons de filtrage rapide par catégorie.
3. **Page Explorer de Recherche (`/search`) :**
   - Outil de filtrage en temps réel par mot-clé et par catégorie avec onglet interactif, tri par ordre alphabétique (A-Z / Z-A), compteur dynamique de résultats, et cartes illustrées par de vraies images d'ambiance avec effet de micro-zoom au survol.
4. **Modal de Détail Réactif & Animé (`TrendDetailModal`) :**
   - S'ouvre de manière fluide sans rechargement de page (URL réactive `?trendId=...`).
   - S'adapte à l'écran : **Bottom Sheet** sur mobile et **Modal Centré** sur PC.
   - Présente la définition, les plateformes clés, le contexte & l'origine, des cas d'usages concrets, et une grille de statistiques percutantes avec une bannière d'illustration à dégradé sombre et flou artistique.
5. **Connexion Supabase de Production :**
   - Configuration Drizzle ORM avec PostgresJS prête pour la production et SSL activé.

---

## 📁 Organisation du Dépôt

```text
augure/
├── app/                       # Application Frontend Next.js 16
│   ├── app/                   # Répertoire des routes (App Router : Accueil, Search, Glossary)
│   ├── components/            # Composants UI (Header, SearchBar, TrendDetailModal, BottomNav...)
│   ├── db/                    # Schéma de base de données et connecteur Drizzle ORM
│   ├── lib/                   # Mocks de données et utilitaires
│   ├── public/                # Assets vectoriels et logos (loading.svg, logo.svg)
│   ├── Dockerfile             # Fichier de build Docker pour le frontend
│   └── package.json           # Scripts de build et dépendances Next.js
├── scraper/                   # Script d'ingestion et de scraping Python
│   ├── Dockerfile             # Fichier de build Docker du scraper
│   └── main.py                # Pipeline d'ingestion
├── docs/                      # Documentation théorique, technique et stratégique
├── docker-compose.yml         # Fichier d'orchestration multi-conteneurs local
└── README.md                  # Ce fichier
```

---

## 👥 L'Équipe Augure (Groupe 6)
* **Gestion de Projet & Stratégie (MD) :** Louis
* **Marketing & Traction (MKTI) :** Kelly & Firdaous
* **UX/Product & Research (UXPO) :** Aurélien
* **Web designer (WD) :** Léa & Aristide
* **Développement & Architecture (DEV) :** Mathilde & Thibault

---

## ⚙️ Installation et Lancement (Local)

### Méthode 1 : Lancement complet (Recommandé avec Docker)
Cette commande lance l'ensemble de la stack (Base de données PostgreSQL + Frontend Next.js + Scraper Python) :

```Bash
# 1. Cloner le dépôt
git clone https://github.com/Poutoo/augure.git
cd augure

# 2. Lancer tous les services
docker compose up --build
```
L'application Next.js est alors accessible sur : `http://localhost:3000`.

### Méthode 2 : Lancement individuel du Frontend (npm)
Si vous souhaitez lancer uniquement l'interface Next.js en dehors de Docker :

```Bash
# 1. Accéder au sous-dossier de l'application Next.js
cd augure/app

# 2. Installer les dépendances
npm install

# 3. Lancer l'environnement de développement
npm run dev
```

### 🗄️ Commandes Drizzle & Base de données (Supabase)
Pour gérer le schéma de base de données à l'aide de l'ORM Drizzle (depuis le dossier `app/`) :

```Bash
# Générer les fichiers de migration
npm run db:generate

# Pousser directement le schéma vers votre base de données Supabase de production
npm run db:push
```
*Assurez-vous d'avoir configuré le fichier `app/.env` avec votre clé de production `DATABASE_URL`.*
