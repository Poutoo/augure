# 📊 Benchmark Technique Global — Version 1

Ce document regroupe les analyses comparatives menées par l'équipe technique de l'agence **Augure** pour structurer le MVP.

## 🟣 Légende des scores
* 🟣 : Excellent / Idéal
* 🟢 : Bon / Adapté
* 🟡 : Moyen / Acceptable avec contraintes
* 🔴 : Insuffisant / Écarté

---

## 🕸️ 1. Stratégie de Scraping & Ingestion de Données

### Tableau Comparatif des Solutions

| Outil / Stack | Prix / Unités | API Disponibles | Points Forts | Points Faibles |
| :--- | :--- | :--- | :--- | :--- |
| **Ensemble Data** | 🟡 Plan gratuit (50 unités / jour) | 🟢 TikTok, Instagram, YouTube, Reddit, Twitch, X, Snapchat | 🟢 Renouvellement quotidien des unités.<br>Grande disponibilité d'API complexes. | 🟡 Limité à 50 requêtes par jour dans le plan gratuit. |
| **Octoparse** | 🔴 Plan gratuit (10 tâches non renouvelables) | 🟢 Large panel (TikTok, LinkedIn, YouTube) | 🟢 Interface visuelle, beaucoup d’API. | 🔴 Trop limité pour développer un MVP fonctionnel. |
| **Script Python** | 🟣 Gratuit (Open Source) | 🟢 Toutes API gratuites et publiques (Reddit, RSS, Google Trends) | 🟣 Liberté totale du choix des données.<br>Pas de bridage sur les volumes publics. | 🔴 Bloqué par les protections de TikTok et Instagram. |

### 🛠️ Décision Arbitrée : Script Python + Dumps JSON Ensemble Data
* **Pourquoi ?** Le script Python (via `PRAW` et `pytrends`) permet de récupérer de façon illimitée les tendances conversationnelles sur Reddit et les flux RSS des grands journaux (60 requêtes/min). Pour TikTok et Instagram, nous utiliserons les 50 unités quotidiennes d'Ensemble Data pendant les 2 semaines de build pour télécharger des fichiers JSON réels (ex: hashtags `#IA`, `#Marketing`). Ces JSON seront stockés localement pour faire tourner l'algorithme sur un historique figé mais réel. Les unités du jour J seront conservées pour une démonstration live au jury.

---

## 💻 2. Architecture Front-End

### Tableau Comparatif

| Stack | Langage | Performance (Cible 45 ans+) | Complexité / Dev | Points Forts | Points Faibles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Next.js** | JS / TS | 🟣 Excellente initiale (SSR & SSG). Léger sur le client car le HTML est pré-rendu. Idéal pour les terminaux anciens. | 🟡 Courbe d'apprentissage modérée.<br>Très bon *time-to-market*. | SEO natif, routing intégré, accessibilité native via le pré-rendu HTML. | Architecture plus rigide pour des builds complexes. |
| **React.js** | JS / TS | 🟡 Chargement initial lourd (Bundle JS complet). Peut ramer sur d'anciens smartphones. | 🟡 Écosystème riche mais fragmenté. | Grande interactivité, communauté immense, parfait pour des UI dynamiques. | Performance initiale sur mobile ancien plus difficile à optimiser. |
| **Vue.js / Nuxt** | JS / TS | 🟣 Réputé pour sa légèreté. Propose du SSR/SSG améliorant l'accessibilité matérielle. | 🟢 Nuxt simplifie l'architecture.<br>Excellent *time-to-market*. | Simplicité, légèreté, documentation claire et flexible. | Écosystème légèrement moins vaste que React. |

### 🛠️ Décision Arbitrée : Next.js (React / TypeScript)
* **Pourquoi ?** L'accessibilité pour notre cible senior/adulte exige un affichage instantané et lisible. Le **SSR (Server-Side Rendering)** de Next.js permet d'envoyer une page HTML déjà construite au navigateur, soulageant le processeur des téléphones plus anciens. De plus, l'intégration native des API Routes facilite le prototypage.

---

## ⚙️ 3. Architecture Back-End

### Tableau Comparatif

| Stack | Langage | Performance | Complexité / Dev | Points Forts | Points Faibles |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js/Express + Supabase** | JS / TS | 🟢 Rapide pour les I/O non bloquantes. Performance BaaS. | 🟢 Léger, flexible.<br>Excellent *time-to-market*. | Uniformité du langage, Auth et BDD simplifiées. | Moins adapté pour les calculs algorithmiques lourds en Python. |
| **Next.js API Routes + Postgres** | JS / TS | 🟢 Performant pour des requêtes légères. Postgres est robuste. | 🟣 Intégration transparente avec le Front.<br>Très bon *time-to-market*. | Unification Front/Back, typage fort avec Prisma, rapidité. | API Routes limitantes pour des logiques de traitement de données lourdes. |
| **Python / FastAPI + Postgres** | Python | 🟣 Extrêmement rapide pour les API. Idéal pour manipuler de la data. | 🟢 Très accessible, moderne et intuitif.<br>Excellent *time-to-market*. | Écosystème Python parfait pour traiter les scripts de scraping et analyser les mots-clés. | Nécessite de maintenir deux langages distincts (JS pour le Front, Python pour le Back). |

### 🛠️ Décision Arbitrée : Python / FastAPI + PostgreSQL
* **Pourquoi ?** Étant donné que notre pipeline de collecte de données (Reddit, RSS, Pytrends) est entièrement écrit en Python, utiliser **FastAPI** pour le Back-End est le choix le plus logique et le plus performant. Cela nous évite de devoir traduire nos scripts de scraping ou nos algorithmes d'analyse lexicale en JavaScript, tout en garantissant des temps de réponse d'API extrêmement courts.
