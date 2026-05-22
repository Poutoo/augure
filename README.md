# 🔮 Augure - Moteur d'Analyse Culturelle Intergénérationnel

> *« Lire les signes que personne ne regarde encore »* > Projet développé dans le cadre de la Compétition B3 2026 — Digital Campus Paris.  

---

## 📂 Index de la Documentation (`/docs`)
Pour garantir une livnobilité maximale du dépôt et isoler le code des analyses théoriques, l'ensemble des études comparatives et des spécifications techniques est répertorié dans le dossier parallèle `docs/` :

* [**📊 Benchmark Technique Global (V1)**](./docs/benchmark_V1.md) — Analyse comparative complète et détaillée des choix de stacks (Scraping, Front, Back).

---

## 🚀 À propos d'Augure

### Le Problème 
L’étanchéité des bulles algorithmiques et l'obsolescence éclair des micro-tendances créent un fossé de communication massif entre les générations. Ce phénomène génère une anxiété d’exclusion sociale et une perte de crédibilité/capital culturel pour les adultes, managers et décideurs de plus de 45 ans lors des interactions sociales ou professionnelles quotidiennes.

### La Vision & Solution (MVP)
Augure est un moteur d'analyse et d'interprétation culturelle. Notre Web App mobile-first ne se contente pas de lister les tendances de manière brute : elle les **vulgarise, les contextualise et fournit des clés d'usage concrètes** (ex: *« comment placer cette tendance en réunion de manière naturelle »*) pour permettre à notre cible de partie-ciper activement aux dynamiques collectives sans paraître décalée.

---

## 🏗️ Architecture Technique Validée (V1)

Suite à nos benchmarks complets (accessibles dans [docs/benchmark_V1.md](./docs/benchmark_V1.md)), voici les choix d'ingénierie retenus pour le MVP :

| Brique | Technologie retenue | Justification Lean & Produit |
| :--- | :--- | :--- |
| **Scraping & Data** | **Script Python** (PRAW + pytrends) + **Ensemble Data** | Permet une récupération gratuite et illimitée des signaux faibles (Reddit/RSS/Google Trends) combinée à l'export ponctuel de dumps JSON réels pour TikTok/Instagram afin de contourner les restrictions d'API sans coût. |
| **Front-End** | **Next.js** (React / TypeScript) | Offre d'excellentes performances initiales grâce au **SSR (Server-Side Rendering)**, réduisant le bundle JS pour les terminaux mobiles potentiellement anciens de notre cible. |
| **Back-End** | **Python / FastAPI** + **PostgreSQL** | Permet d'intégrer nativement nos scripts et algorithmes de scraping Python dans l'écosystème de l'API sans surcouche de traduction. FastAPI offre un *time-to-market* et une vitesse d'exécution optimaux. |

---

## 📁 Organisation du Dépôt

```text
augure/
├── docs/                      # Documentation théorique, technique et stratégique
│   ├── benchmark_V1.md        # Benchmark détaillé de la brique Technique (Scraping, Front, Back)
│   ├── cadrage_S1.md          # Note de cadrage stratégique (Station 1)
│   └── research_S2.md         # Synthèse des recherches terrain et insights (Station 2)
├── src/                       # Code source de l'application (Bloc 2)
│   ├── components/            # Composants UI isolés (Focus accessibilité / contrastes seniors)
│   ├── pages/                 # Vues principales (Recherche, Fiche Tendance, Glossaire)
│   ├── services/              # Pipeline d'ingestion et d'analyse des données
│   └── styles/                # Configuration Tailwind CSS (Gestion de la taille dynamique des polices)
├── package.json               # Dépendances et scripts front-end
└── README.md                  # Présentation générale et index du dépôt (Ce fichier)
