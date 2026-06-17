import os
import json
import requests
import uuid
import schedule
import time
import re
import argparse
from datetime import datetime
from rapidfuzz import fuzz, process
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Chargement de la configuration
load_dotenv()
API_KEY = os.getenv("ENSEMBLEDATA_API_KEY")
DB_URL = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
SKIP_AUTO_RUN = os.getenv("SKIP_AUTO_RUN", "false").lower() == "true"

# Mapping pour les catégories de l'application
CATEGORY_MAPPING = {
    "Mode": "fashion",
    "Food": "food",
    "Musique": "music",
    "Art": "art",
    "Beauté": "beauty",
    "Tech": "tech"
}

# Liste de secours si la DB est inaccessible
FALLBACK_BAN = {
    "fyp", "foryou", "foryoupage", "viral", "trending",
    "xyzbca", "xyz", "pourtoi", "pov", "grwm", "ootd",
    "foryourpage", "blowthisup", "makeitgofyp", "trend", "explore", "video"
}

def get_banned_hashtags(connection):
    """Charge la liste des hashtags bannis depuis la base de données."""
    try:
        query = text("SELECT tag FROM banned_hashtags")
        result = connection.execute(query).fetchall()
        if not result:
            return FALLBACK_BAN
        return {row[0].lower() for row in result}
    except Exception as e:
        print(f"⚠️ Impossible de charger les hashtags bannis : {e}")
        return FALLBACK_BAN

def is_valid_trend_hashtag(tag, view_count, banned_list):
    """
    Vérifie si un hashtag est pertinent pour une tendance émergente.
    Traitement : Amélioration B (Filtrage dynamique par volume).
    """
    tag = tag.lower().strip().replace("#", "")
    
    # 1. Vérification liste noire
    if tag in banned_list:
        return False
    
    # 2. Filtrage par volume : > 500M = macro-tendance (trop mainstream)
    if view_count > 500000000:
        return False
        
    # 3. Filtrage par longueur
    if len(tag) < 3:
        return False
        
    return True

def get_api_stats():
    """Affiche les crédits utilisés et totaux au démarrage."""
    url = "https://ensembledata.com/apis/customer/get-usage"
    try:
        response = requests.get(url, params={"token": API_KEY}, timeout=10)
        data = response.json().get("data", {})
        print(f"📊 [CRÉDITS] Utilisés : {data.get('used_units', 'N/A')} | Total : {data.get('total_units', 'N/A')}", flush=True)
    except Exception as e:
        print(f"⚠️ Impossible de récupérer les stats : {e}")

def get_api_usage():
    """Récupère le nombre d'unités restantes."""
    url = "https://ensembledata.com/apis/customer/get-usage"
    try:
        response = requests.get(url, params={"token": API_KEY}, timeout=10)
        data = response.json().get("data", {})
        used = data.get('used_units', 0)
        total = data.get('total_units', 0)
        return total - used
    except Exception:
        return 0

def clean_trend_title(raw_title, search_keyword, banned_list):
    """Nettoie le titre en supprimant les hashtags parasites et le bruit."""
    if not raw_title:
        return search_keyword.title()
    
    # Remplacement des underscores/tirets par des espaces
    raw_title = raw_title.replace('_', ' ').replace('-', ' ')
    # Suppression des hashtags (#tag) et conversion en mots
    words = re.sub(r'#\w+', '', raw_title).lower().split()
    # Filtrage via la liste dynamique
    filtered = [w for w in words if w not in banned_list and len(w) > 1]
    cleaned = " ".join(filtered).strip()
    
    # Si le résultat est trop court ou vide, on fallback sur le mot-clé
    if len(cleaned) < 5:
        return search_keyword.title()
    
    return cleaned.title()

def extract_signals(posts, keyword, banned_list):
    """
    Extrait les hashtags, musiques et détecte les co-occurrences.
    Amélioration C : Co-occurrence de hashtags de niche.
    """
    hashtags_freq = {}
    music_freq = {}
    co_occurrences = {}
    unique_authors = set()

    for post in posts:
        aweme_info = post.get('aweme_info', {})
        author_id = aweme_info.get('author', {}).get('unique_id')
        if author_id:
            unique_authors.add(author_id)
            
        # 1. Extraction et filtrage des hashtags de la vidéo
        cha_list = aweme_info.get('cha_list', []) or []
        current_video_tags = set()
        
        for cha in cha_list:
            name = cha.get('hashtag_name', '').lower()
            if name and name != keyword.lower() and is_valid_trend_hashtag(name, 0, banned_list):
                hashtags_freq[name] = hashtags_freq.get(name, 0) + 1
                current_video_tags.add(name)
        
        if not cha_list:
            desc = aweme_info.get('desc', '')
            found_hashtags = re.findall(r'#(\w+)', desc)
            for h in found_hashtags:
                h_low = h.lower()
                if h_low != keyword.lower() and is_valid_trend_hashtag(h_low, 0, banned_list):
                    hashtags_freq[h_low] = hashtags_freq.get(h_low, 0) + 1
                    current_video_tags.add(h_low)

        # 2. Détection de co-occurrence (paires de hashtags)
        tags_list = sorted(list(current_video_tags))
        for i in range(len(tags_list)):
            for j in range(i + 1, len(tags_list)):
                pair = tuple(sorted([tags_list[i], tags_list[j]]))
                co_occurrences[pair] = co_occurrences.get(pair, 0) + 1

        # 3. Musique
        music = aweme_info.get('music', {})
        if music:
            music_id = music.get('id_str') or str(music.get('id', ''))
            if music_id:
                if music_id not in music_freq:
                    music_freq[music_id] = {
                        "id": music_id,
                        "title": music.get('title', 'Unknown'),
                        "author": music.get('author', 'Unknown'),
                        "count": 0
                    }
                music_freq[music_id]["count"] += 1

    # Tri et sélection
    top_hashtags = sorted(hashtags_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Identification des clusters (paires apparaissant sur > 1 vidéo)
    clusters = [
        {"tags": list(pair), "count": count} 
        for pair, count in co_occurrences.items() if count > 1
    ]
    
    weak_signals_hashtags = {
        "top_tags": [{"name": name, "count": count} for name, count in top_hashtags],
        "clusters": sorted(clusters, key=lambda x: x["count"], reverse=True)[:3],
        "unique_creators_count": len(unique_authors)
    }

    top_music = sorted(music_freq.values(), key=lambda x: x["count"], reverse=True)[:3]
    
    return weak_signals_hashtags, top_music, len(unique_authors)

def calculate_trend_status(current_views, previous_views, original_post_at=None):
    """
    Calcule le statut basé sur les seuils d'audit (Volume + Momentum).
    Intègre la normalisation temporelle (Pics de week-end et posts Flash).
    """
    now = datetime.now()
    
    # 1. Calcul du momentum (J-1) avec lissage week-end
    growth = 0
    if previous_views > 0:
        growth = (current_views - previous_views) / previous_views
        
        # Normalisation Week-end : Le trafic est souvent +30% supérieur le samedi/dimanche
        # On réduit légèrement le momentum calculé ces jours-là pour éviter les faux VIRAL
        if now.weekday() in [5, 6]: # Samedi ou Dimanche
            growth = growth * 0.8
            
    # 2. Calcul de la vélocité quotidienne (Vq) pour les contenus récents
    velocity = 0
    if original_post_at:
        # Assurer la cohérence des fuseaux horaires (simplifié)
        delta = now - original_post_at.replace(tzinfo=None)
        
        # Cas Post Flash (<2h) : On impose un plancher de 1 jour pour ne pas diviser par zéro
        # et pour exiger une preuve d'endurance du contenu.
        days = max(1, delta.days) 
        velocity = current_views / days

    # 3. Matrice de Décision
    
    # Cas EN_BAISSE (Momentum négatif ou quasi-nul sur vieux contenu)
    if growth < -0.05 and previous_views > 0:
        return "EN_BAISSE"

    # Cas VIRAL : > 5M vues ET (croissance explosive > 50% OU vélocité > 500k/j)
    if current_views > 5000000 and (growth > 0.5 or velocity > 500000):
        return "VIRAL"
    
    # Cas STABLE : > 5M vues mais croissance stabilisée
    if current_views > 5000000:
        return "STABLE"

    # Cas EN_HAUSSE : 1M-5M vues ET croissance positive notable (> 20%)
    if 1000000 <= current_views <= 5000000 and growth > 0.2:
        return "EN_HAUSSE"
    
    # Cas EMERGENT : < 1M vues ET croissance positive
    if current_views < 1000000:
        # Si c'est un contenu de niche qui commence à peine
        if growth > 0.1 or velocity > 10000:
            return "EMERGENT"

    return "STABLE"

def fetch_audience_demographics(username, dry_run=False):
    """Appelle l'API EnsembleData pour obtenir la distribution par âge (Coût: 26 unités)."""
    if dry_run:
        return {"13-17": 0, "18-24": 0.45, "25-34": 0.35, "35-44": 0.15, "45-65": 0.05, "65-plus": 0}

    print(f"📊 [AUDIENCE] Analyse démographique pour @{username}...")
    url = "https://ensembledata.com/apis/tt/user/audience-demographics"
    try:
        response = requests.get(url, params={"username": username, "token": API_KEY}, timeout=20)
        response.raise_for_status()
        data = response.json().get("data", {})
        raw_age = data.get("age_distribution", {})
        distribution = {
            "13-17": 0,
            "18-24": raw_age.get("18-24", 0),
            "25-34": raw_age.get("25-34", 0),
            "35-44": raw_age.get("35-44", 0),
            "45-65": raw_age.get("45-54", 0) + raw_age.get("55+", 0),
            "65-plus": 0
        }
        return distribution
    except Exception as e:
        print(f"⚠️ Échec de la récupération d'audience : {e}")
        return None

def identify_trend_name(posts, category_keyword, banned_list, connection=None):
    """
    Identifie le nom de la tendance et fournit un slug stable via dédoublonnage fuzzy.
    Traitement : Amélioration A (Dédoublonnage fuzzy ratio > 85).
    """
    # 1. Extraction du hashtag dominant
    hashtag_counts = {}
    for post in posts:
        cha_list = post.get('aweme_info', {}).get('cha_list', []) or []
        for cha in cha_list:
            name = cha.get('hashtag_name', '').lower()
            if name and name not in banned_list:
                hashtag_counts[name] = hashtag_counts.get(name, 0) + 1
    
    top_tag = None
    if hashtag_counts:
        top_tag = sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[0][0]

    # 2. Détermination du Titre (Pipeline Cascade)
    raw_name = ""
    top_post = posts[0].get('aweme_info', {})
    search_desc = top_post.get('search_desc')
    
    if search_desc and len(search_desc) > 3:
        raw_name = search_desc
    elif top_tag:
        raw_name = top_tag
    else:
        raw_name = category_keyword

    clean_name = clean_trend_title(raw_name, category_keyword, banned_list)

    # 3. Dédoublonnage Fuzzy (Amélioration A)
    stable_slug = f"{category_keyword.lower()}-{ (top_tag if top_tag else category_keyword.lower()).replace('_', '-') }"
    
    if connection:
        try:
            query = text("SELECT title, slug FROM trends WHERE category = :cat")
            existing_trends = connection.execute(query, {"cat": category_keyword}).fetchall()
            
            if existing_trends:
                titles = [row[0] for row in existing_trends]
                match = process.extractOne(clean_name, titles, scorer=fuzz.WRatio)
                
                if match and match[1] > 85:
                    matched_title = match[0]
                    for row in existing_trends:
                        if row[0] == matched_title:
                            print(f"🔄 [FUZZY] Fusion de '{clean_name}' avec '{matched_title}' (Score: {match[1]})")
                            return matched_title, row[1]
        except Exception as e:
            print(f"⚠️ Erreur lors du dédoublonnage fuzzy : {e}")

    return clean_name, stable_slug

def insert_to_db(connection, title, slug, total_views, platform_name, category, hashtags, music, description=None, context=None, age_dist=None, original_post_at=None, dry_run=False):
    """Insère ou met à jour la tendance avec un slug persistant."""
    previous_views = 0
    existing = None

    if not dry_run:
        prev_query = text("SELECT score_base, status FROM trends WHERE slug = :slug")
        existing = connection.execute(prev_query, {"slug": slug}).fetchone()
        
        if existing:
            previous_views = existing.score_base
            if total_views != previous_views:
                snapshot_query = text("""
                    INSERT INTO trends_snapshots (id, trend_slug, views_count, recorded_at)
                    VALUES (:id, :slug, :views, NOW())
                """)
                connection.execute(snapshot_query, {"id": str(uuid.uuid4()), "slug": slug, "views": previous_views})
    else:
        previous_views = 500000 

    new_status = calculate_trend_status(total_views, previous_views, original_post_at=original_post_at).upper()

    if dry_run:
        print(f"🧪 [DRY-RUN] Serait inséré : {title} | Slug: {slug} | Status: {new_status} | Vues: {total_views}")
        return

    query = text("""
        INSERT INTO trends (
            id, title, slug, description, context, usage_example, 
            score_base, platforms, status, category, 
            weak_signals_hashtags, weak_signals_music, age_distribution, 
            original_post_at, created_at
        )
        VALUES (
            :id, :title, :slug, :description, :context, :usage_example, 
            :score, :platforms, :status, :category, 
            :hashtags, :music, :age_dist, 
            :original_post_at, NOW()
        )
        ON CONFLICT (slug) DO UPDATE 
        SET title = EXCLUDED.title,
            score_base = EXCLUDED.score_base,
            status = EXCLUDED.status,
            description = EXCLUDED.description,
            weak_signals_hashtags = EXCLUDED.weak_signals_hashtags,
            weak_signals_music = EXCLUDED.weak_signals_music,
            age_distribution = COALESCE(EXCLUDED.age_distribution, trends.age_distribution),
            original_post_at = COALESCE(EXCLUDED.original_post_at, trends.original_post_at);
    """)
    
    connection.execute(query, {
        "id": str(uuid.uuid4()), 
        "title": title, 
        "slug": slug,
        "description": description or f"Analyse de la tendance {title}.",
        "context": context or "Détecté via l'analyse des signaux faibles TikTok.",
        "usage_example": f"Utilisez les codes de {title} dans votre prochain contenu.",
        "score": total_views, 
        "platforms": json.dumps([platform_name]),
        "status": new_status,
        "category": category,
        "hashtags": json.dumps(hashtags),
        "music": json.dumps(music),
        "age_dist": json.dumps(age_dist) if age_dist else None,
        "original_post_at": original_post_at
    })
    connection.commit()
    print(f"✅ [{platform_name.upper()}] '{title}' ({new_status}) synchronisé. Vues: {total_views} (+{total_views-previous_views if existing else 0})")

def scrape_tiktok(category, dry_run=False):
    """Récupère et analyse les signaux faibles TikTok pour une catégorie donnée."""
    if not API_KEY and not dry_run:
        print("❌ ERREUR: API_KEY manquante.")
        return

    keyword = CATEGORY_MAPPING.get(category, category.lower())
    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] {'[DRY-RUN] ' if dry_run else ''}Analyse TikTok pour '{category}' (Mot-clé: {keyword})...", flush=True)
    
    try:
        engine = create_engine(DB_URL)
        banned_list = FALLBACK_BAN
        
        with engine.connect() as conn:
            if not dry_run:
                banned_list = get_banned_hashtags(conn)

            if dry_run:
                raw_json = {
                    "data": [
                        {
                            "aweme_info": {
                                "desc": f"Ceci est une simulation de tendance pour {category} #test #viral",
                                "statistics": {"play_count": 1250000},
                                "author": {"unique_id": "user_test"},
                                "music": {"id_str": "123", "title": "Mock Music", "author": "Mock Artist"},
                                "cha_list": [{"hashtag_name": "test"}, {"hashtag_name": "viral"}]
                            }
                        }
                    ]
                }
            else:
                url = "https://ensembledata.com/apis/tt/keyword/search"
                params = {"name": keyword, "period": "7", "sorting": "1", "token": API_KEY}
                response = requests.get(url, params=params, timeout=20)
                response.raise_for_status()
                raw_json = response.json()

            posts = raw_json.get("data", [])
            if isinstance(posts, dict): posts = posts.get("data", [])
                
            if posts:
                sample_posts = posts[:20]
                weak_signals_hashtags, music, unique_creators_count = extract_signals(sample_posts, keyword, banned_list)
                
                if unique_creators_count < 5 and not dry_run:
                    print(f"⚠️ Tendance '{keyword}' ignorée : seulement {unique_creators_count} créateurs uniques (seuil: 5).")
                    return

                top_post = sample_posts[0]
                aweme_info = top_post.get('aweme_info', {})
                author = aweme_info.get('author', {})
                username = author.get('unique_id')
                
                statistics = aweme_info.get('statistics', {})
                raw_views = statistics.get('play_count', 0)
                
                # Passer la connexion pour le dédoublonnage fuzzy
                title, slug = identify_trend_name(sample_posts, keyword, banned_list, connection=conn if not dry_run else None)
                
                description = aweme_info.get('desc')
                create_time = aweme_info.get('create_time')
                original_post_at = datetime.fromtimestamp(create_time) if create_time else None
                
                age_dist = None
                if dry_run:
                    age_dist = fetch_audience_demographics(username, dry_run=True)
                else:
                    remaining_credits = get_api_usage()
                    if remaining_credits > 30 and username:
                        age_dist = fetch_audience_demographics(username)
                
                if dry_run:
                    insert_to_db(None, title, slug, int(raw_views), "tiktok", category, weak_signals_hashtags, music, description=description, age_dist=age_dist, original_post_at=original_post_at, dry_run=True)
                else:
                    insert_to_db(conn, title, slug, int(raw_views), "tiktok", category, weak_signals_hashtags, music, description=description, age_dist=age_dist, original_post_at=original_post_at)
            else:
                print(f"⚠️ Aucune donnée pour '{category}'.")
    except Exception as e:
        print(f"❌ Erreur sur '{category}' : {e}")

def run_all_categories(dry_run=False):
    """Parcourt toutes les catégories."""
    for category in CATEGORY_MAPPING.keys():
        scrape_tiktok(category, dry_run=dry_run)
        if not dry_run: time.sleep(2)

def main():
    parser = argparse.ArgumentParser(description="Orchestrateur Augure Scraper")
    parser.add_argument("--dry-run", action="store_true", help="Simule l'exécution sans consommer de crédits API")
    args = parser.parse_args()

    print(f"🚀 Orchestrateur Augure prêt. {'[MODE DRY-RUN]' if args.dry_run else ''}")
    if not args.dry_run:
        get_api_stats()
        run_all_categories()
        schedule.every().day.at("04:00").do(run_all_categories)
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        run_all_categories(dry_run=True)
        print("🧪 Dry-run terminé avec succès.")

if __name__ == "__main__":
    main()
