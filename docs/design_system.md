# 🎨 Design System — Augure

Ce document centralise les spécifications techniques de l'identité visuelle d'Augure, validées par l'équipe Web Design (WD). L'intégralité du frontend (Next.js + Tailwind CSS) doit se conformer strictement à ces jetons de design (design tokens).

---

## 1. Palette de Couleurs (Contrainte Noir & Blanc)

Conformément aux règles de la compétition, l'application utilise exclusivement une palette achromatique et des nuances de gris pour structurer l'expérience utilisateur.

| Nom de la variable | Code Hexa | Usage UI principal |
| :--- | :--- | :--- |
| `color-noir` | `#0C0C0F` | Texte principal, arrière-plans sombres |
| `color-gris-fonce` | `#3D3D3D` | Textes secondaires, icônes actifs |
| `color-gris-moyen` | `#6B6B7B` | Labels, métadonnées, légendes (captions) |
| `color-gris-clair` | `#D5D5D5` | Bordures, séparateurs |
| `color-gris-tres-clair` | `#F2F2F8` | Surfaces, arrière-plans de cartes |
| `color-blanc` | `#FFFFFF` | Fond principal de l'application, texte sur fond sombre |

### Règles d'usage du Logo
* **Signature graphique** : Le point terminal fait partie intégrante du logotype. Il ne doit jamais être altéré ou supprimé.
* **Proportions** : Interdiction stricte de modifier l'échelle ou d'étirer les caractères.
* **Contrastes autorisés** : Noir sur blanc, blanc sur noir, ou noir sur gris très clair uniquement.

---

## 2. Typographie

L'identité visuelle d'Augure repose sur l'utilisation d'une **famille typographique unique : Syne**. L'utilisation de polices tierces (type Inter) a été révoquée pour garantir l'impact de la direction artistique.

### Échelle Typographique (Modular Scale)

* **Display (60px)**
  * `font-family: 'Syne', sans-serif;`
  * `font-weight: 700 (Bold);`
  * *Usage :* Titres d'impact majeurs (ex: Quiet Luxury).
* **H1 (36px)**
  * `font-family: 'Syne', sans-serif;`
  * `font-weight: 700 (Bold);`
  * *Usage :* Titres de sections principales (ex: Top tendances).
* **H2 (24px)**
  * `font-family: 'Syne', sans-serif;`
  * `font-weight: 700 (Bold);`
  * *Usage :* Sous-titres et catégories (ex: Catégories).
* **Label (16px)**
  * `font-family: 'Syne', sans-serif;`
  * `font-weight: 700 (Bold);`
  * *Usage :* Éléments de navigation, boutons, puces de filtres (ex: MODE · FOOD).
* **Caption (13px)**
  * `font-family: 'Syne', sans-serif;`
  * `font-weight: 700 (Bold);`
  * *Usage :* Métadonnées complémentaires, dates, géolocalisation.
* **Micro (11px)**
  * `font-family: 'Syne', sans-serif;`
  * `font-weight: 700 (Bold);`
  * *Usage :* Éléments d'information très secondaires (ex: TRANCHE D'ÂGE).

---

## 3. Spécifications des Composants UI

### 3.1 Chips (Filtres & Catégories)
* **Dimensions** : Largeur `64px` | Hauteur `36px`
* **Border Radius** : `18px` (Full rounded)
* **Padding** : Haut `10px` | Droite `14px` | Bas `10px` | Gauche `14px`
* **Layout** : Flexbox avec un `gap: 10px`

### 3.2 Badges de Statut (Trend Status)
* **Dimensions** : Largeur `85px` | Hauteur `21px`
* **Border Radius** : `5px`
* **Padding** : Haut `4px` | Droite `8px` | Bas `4px` | Gauche `8px`
* **Layout** : Flexbox avec un `gap: 10px`

### 3.3 Cartes d'Onboarding — Choix du Rôle
* **Dimensions** : Largeur `174px` | Hauteur `124px`
* **Border Radius** : `14px`
* **Bordure** : Épaisseur `1.5px` (`border-width`)
* **Padding** : Haut `42px` | Droite `13px` | Bas `43px` | Gauche `14px`
* **Layout** : Flexbox avec un `gap: 10px`

### 3.4 Cartes d'Onboarding — Choix du Plan Tarifaire
* **Dimensions** : Largeur `176px` | Hauteur `139px`
* **Positionnement type** : `top: 20px` | `left: 20px`