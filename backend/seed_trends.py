"""
Seed de tendances de test avec leurs tags de matching.
Utilise les nouvelles tranches d'âge : 13-17, 18-24, 25-34, 35-44, 45-65, 65-plus

Usage :
    python seed.py          # intérêts d'abord
    python seed_trends.py   # puis tendances
"""

from app.database import SessionLocal
from app.models import TagType, Trend, TrendStatus, TrendTag

_TRENDS: list[dict] = [
    {
        "title": "Six Seven Aesthetic",
        "description": "Esthétique mode inspirée des années 60-70, portée massivement par la Gen Z.",
        "context": "Née sur TikTok fin 2023, cette tendance revisite les codes vestimentaires des années 60-70.",
        "usage_example": "Créer un contenu 'Get Ready With Me' avec une tenue vintage pour toucher une audience 13-24 ans.",
        "score_base": 5,
        "status": TrendStatus.VIRAL,
        "tags": [
            (TagType.INTEREST,   "mode"),
            (TagType.INTEREST,   "lifestyle"),
            (TagType.GENERATION, "13-17"),
            (TagType.GENERATION, "18-24"),
            (TagType.ROLE,       "community_manager"),
            (TagType.ROLE,       "influenceur"),
        ],
    },
    {
        "title": "Matcha Coded",
        "description": "Le matcha comme symbole d'un mode de vie sain et esthétique.",
        "context": "Phénomène parti de Pinterest, fusionnant bien-être et esthétique minimaliste.",
        "usage_example": "Mettre en scène une routine matinale matcha pour une audience 18-35 ans CSP+.",
        "score_base": 3,
        "status": TrendStatus.EN_HAUSSE,
        "tags": [
            (TagType.INTEREST,   "food"),
            (TagType.INTEREST,   "lifestyle"),
            (TagType.INTEREST,   "beaute"),
            (TagType.GENERATION, "18-24"),
            (TagType.GENERATION, "25-34"),
            (TagType.ROLE,       "community_manager"),
            (TagType.ROLE,       "agence"),
        ],
    },
    {
        "title": "Gorpcore Kids",
        "description": "Mode outdoor et fonctionnelle adoptée par les enfants et ados.",
        "context": "Les enfants réclament des vêtements techniques (Arc'teryx, Salomon).",
        "usage_example": "Campagne back-to-school orientée outdoor pour les parents d'enfants 8-14 ans.",
        "score_base": 2,
        "status": TrendStatus.EMERGENT,
        "tags": [
            (TagType.INTEREST,   "mode"),
            (TagType.INTEREST,   "sport"),
            (TagType.GENERATION, "13-17"),
            (TagType.ROLE,       "parent"),
            (TagType.ROLE,       "teacher"),
        ],
    },
    {
        "title": "Brain Rot Slang",
        "description": "Évolution du langage internet Gen Z : 'rizz', 'skibidi', 'sigma'.",
        "context": "Langage issu des memes TikTok, incompréhensible pour les 30+ ans.",
        "usage_example": "Glossaire de termes à intégrer (avec parcimonie) dans des copies pour toucher les 13-20 ans.",
        "score_base": 4,
        "status": TrendStatus.VIRAL,
        "tags": [
            (TagType.INTEREST,   "langage"),
            (TagType.INTEREST,   "musique"),
            (TagType.GENERATION, "13-17"),
            (TagType.GENERATION, "18-24"),
            (TagType.ROLE,       "teacher"),
            (TagType.ROLE,       "community_manager"),
        ],
    },
    {
        "title": "Old Money Aesthetic",
        "description": "Esthétique sobre et luxueuse inspirée de l'aristocratie anglaise.",
        "context": "Contraction entre minimalisme et aspirations au luxe discret, portée par TikTok.",
        "usage_example": "Shooting éditorial pour une marque premium ciblant les 22-35 ans.",
        "score_base": 3,
        "status": TrendStatus.STABLE,
        "tags": [
            (TagType.INTEREST,   "mode"),
            (TagType.INTEREST,   "art"),
            (TagType.GENERATION, "18-24"),
            (TagType.GENERATION, "25-34"),
            (TagType.ROLE,       "agence"),
            (TagType.ROLE,       "influenceur"),
        ],
    },
    {
        "title": "Kidcore Revival",
        "description": "Retour aux esthétiques enfantines des années 90-2000.",
        "context": "Nostalgie des parents Millennials projetée sur leurs enfants.",
        "usage_example": "Ligne capsule back-to-school avec des motifs cartoon pour les 6-12 ans.",
        "score_base": 1,
        "status": TrendStatus.EMERGENT,
        "tags": [
            (TagType.INTEREST,   "mode"),
            (TagType.INTEREST,   "art"),
            (TagType.GENERATION, "13-17"),
            (TagType.ROLE,       "parent"),
            (TagType.ROLE,       "agence"),
        ],
    },
    {
        "title": "Slow Living 35+",
        "description": "Décélération consciente adoptée par les millennials seniors et la Gen X.",
        "context": "Mouvement de fond : déconnexion, artisanat, cuisine maison. Porté sur Instagram et Pinterest.",
        "usage_example": "Campagne lifestyle pour les 35-55 ans valorisant l'authenticité et la durabilité.",
        "score_base": 3,
        "status": TrendStatus.EN_HAUSSE,
        "tags": [
            (TagType.INTEREST,   "lifestyle"),
            (TagType.INTEREST,   "food"),
            (TagType.GENERATION, "35-44"),
            (TagType.GENERATION, "45-65"),
            (TagType.ROLE,       "agence"),
            (TagType.ROLE,       "content_creator"),
        ],
    },
    {
        "title": "Silver Tech",
        "description": "Adoption massive des outils numériques par les 50-70 ans.",
        "context": "Les seniors deviennent une cible premium pour les apps, e-commerce et objets connectés.",
        "usage_example": "Tutoriels tech accessibles et campagnes inclusives pour les 50-65+ ans.",
        "score_base": 2,
        "status": TrendStatus.EMERGENT,
        "tags": [
            (TagType.INTEREST,   "tech"),
            (TagType.GENERATION, "45-65"),
            (TagType.GENERATION, "65-plus"),
            (TagType.ROLE,       "agence"),
            (TagType.ROLE,       "community_manager"),
        ],
    },
]


def seed_trends() -> None:
    db = SessionLocal()
    try:
        existing_titles = {t.title for t in db.query(Trend.title).all()}
        added = 0
        for data in _TRENDS:
            if data["title"] in existing_titles:
                continue
            
            slug = data["title"].lower().replace(" ", "-").replace("'", "")
            
            trend = Trend(
                title=data["title"],
                slug=slug,
                description=data["description"],
                context=data["context"],
                usage_example=data["usage_example"],
                score_base=data["score_base"],
                status=data["status"],
            )
            db.add(trend)
            db.flush()
            for tag_type, value in data["tags"]:
                db.add(TrendTag(trend_id=trend.id, tag_type=tag_type, value=value))
            added += 1
        db.commit()
        print(f"✓ {added} tendance(s) ajoutée(s).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_trends()
