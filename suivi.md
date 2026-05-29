# Suivi du Projet

## Nouvelles Features (MVP)

## Nouvelles Features (MVP)

## Nouvelles Features (MVP)

- **29 Mai 2026** : Refonte page Explorer (`/search`) :
  - Header avec bouton retour + titre "Tendances".
  - Barre de recherche avec filtrage en temps réel.
  - Onglets catégories avec soulignement actif (Tous, Mode, Food, Musique, Art...).
  - Compteur de résultats + bouton Trier (A→Z, Z→A).
  - Nouveau composant `ExplorerTrendCard` (catégorie, titre, plateformes, statut, vignette).


- **29 Mai 2026** : Initialisation du MVP d'Augure.
  - Configuration de l'environnement (Tailwind v4, Polices Syne et Inter, Iconify).
  - Mise en place de l'ORM Drizzle (préparation pour la DB).
  - Création des composants UI de base (Header, SearchBar, TrendCard).
  - Développement des 3 écrans principaux du MVP (Accueil, Fiche Tendance, Glossaire) en utilisant des données mockées.


- **29 Mai 2026** : Configuration du déploiement de production (Hybride Vercel + Supabase) :
  - Création du client Drizzle pour PostgresJS (`app/db/index.ts`).
  - Configuration de Drizzle Kit (`app/drizzle.config.ts`) pour la migration de schéma vers Supabase.
  - Ajout des scripts npm pour générer (`db:generate`) et pousser (`db:push`) le schéma de base de données.
  - Création du template de variables d'environnement (`app/.env.example`).


## Bugs Fixés
