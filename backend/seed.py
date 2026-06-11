"""
Peuple la table `interests` avec les centres d'intérêt par défaut
déduits des maquettes (my-audience.png + resume-and-ready.png).

Usage :
    python seed.py
"""

from app.database import SessionLocal
from app.models import Interest

# Basé sur les maquettes Augure + catégories du front
_INTERESTS: list[dict[str, str]] = [
    {"name": "Mode",      "slug": "mode"},
    {"name": "Food",      "slug": "food"},
    {"name": "Tech",      "slug": "tech"},
    {"name": "Musique",   "slug": "musique"},
    {"name": "Art",       "slug": "art"},
    {"name": "Lifestyle", "slug": "lifestyle"},
    {"name": "Beauté",    "slug": "beaute"},
    {"name": "Langage",   "slug": "langage"},
    {"name": "Sport",     "slug": "sport"},
]


def seed_interests() -> None:
    db = SessionLocal()
    try:
        existing = {row.slug for row in db.query(Interest.slug).all()}
        new = [
            Interest(name=i["name"], slug=i["slug"])
            for i in _INTERESTS
            if i["slug"] not in existing
        ]
        if new:
            db.add_all(new)
            db.commit()
            print(f"✓ {len(new)} intérêt(s) ajouté(s).")
        else:
            print("✓ Intérêts déjà présents, rien à faire.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_interests()
