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


- **29 Mai 2026** : Modal de tendance responsive (Mobile & Desktop) :
  - Création du composant `TrendDetailModal` affichant la fiche détaillée (définition, plateforme, statistiques sous forme de grid, contexte, boutons d'action).
  - Intégration globale du modal dans `layout.tsx` à l'aide d'un paramètre d'URL `trendId` réactif.
  - Mise à jour des composants cartes (`TrendListItem`, `TopTrendCard`, `ExplorerTrendCard`, `TrendCard`) pour ouvrir le modal de manière fluide au clic sans recharger la page.


- **29 Mai 2026** : Splash Screen Diagonal d'Introduction (Welcome Shutter) :
  - Création d'une animation d'entrée haut de gamme s'exécutant uniquement à la toute première ouverture de l'application (sauvegardé en `sessionStorage`).
  - Découpe diagonale animée de l'image vectorielle `loading.svg` (séparation vers les coins Haut-Gauche / Bas-Droit) pour révéler le site.
  - Résolution de l'interstice blanc (sub-pixel gap) de découpe en étendant le clip-path du premier volet à `101%` pour forcer un chevauchement invisible.
  - Restauration de la navigation interne (`BottomNav`) en liens natifs et instantanés pour maximiser la vitesse d'expérience utilisateur.


- **29 Mai 2026** : Illustrations visuelles pour les tendances :
  - Ajout d'un attribut `image: string` à l'interface `Trend` dans les mocks.
  - Enrichissement des objets mocks avec des URLs d'images d'illustrations haute définition (Unsplash) thématisées selon chaque catégorie de tendance.
  - Mise à jour de `ExplorerTrendCard` pour afficher l'image réelle dans la vignette avec un effet de micro-zoom survolé, en remplacement du fond noir temporaire.
  - Intégration de l'image de tendance en arrière-plan de la bannière dans `TrendDetailModal` (avec un filtre de flou subtil et un dégradé de noir progressif pour maximiser le contraste des boutons).


- **29 Mai 2026** : Transitions fluides inter-pages (PageAnimate) :
  - Création du composant `PageAnimate` détectant les changements d'URLs.
  - Application d'une animation d'entrée ultra-fluide mêlant fondu (`opacity`), défilement vers le haut (`translate-y-4` vers `translate-y-0`) et léger flou artistique sortant (`blur-sm` vers `blur-none`) en 300ms à chaque navigation.


- **29 Mai 2026** : Transformation en PWA (Progressive Web App) :
  - Configuration de la dépendance `@ducanh2912/next-pwa` dans `next.config.ts` pour générer automatiquement le Service Worker et gérer la mise en cache hors ligne en production.
  - Création du manifeste d'application [manifest.json](file:///c:/Users/thiba/Desktop/Code/B3DEV/augure/app/public/manifest.json) déclarant les couleurs de thème (`#4127FF`), le démarrage autonome (`standalone`) et les icônes.
  - Déclaration des balises meta de PWA compatibles iOS (Apple Web App) et Android directement dans les métadonnées de Next.js (`layout.tsx`).


## Bugs Fixés

- **29 Mai 2026** : Correction de l'interstice blanc sub-pixel séparant les deux volets de découpe diagonale en appliquant un chevauchement de `101%` sur le polygone haut-gauche.

- **29 Mai 2026** : Résolution de la pixellisation de l'image de chargement sur PC/Desktop en remplaçant le fichier raster `loading.png` par sa version vectorielle `loading.svg` pour assurer une netteté absolue sur tous les écrans.

- **29 Mai 2026** : Résolution de l'erreur de compilation TypeScript (indexation implicite 'any') sur Vercel dans `TrendDetailModal.tsx` en important et appliquant le type d'interface strict `Trend` au lieu de `any` pour l'état `activeTrend`.

- **29 Mai 2026** : Correction définitive du scintillement (flash) lors des transitions inter-pages. L'état réactif de visibilité est désormais mis à jour de manière synchrone pendant la phase de render (React State Adjustment) dès qu'un changement d'URL est détecté, empêchant la nouvelle page de s'afficher brièvement à 100% d'opacité avant de s'animer.
