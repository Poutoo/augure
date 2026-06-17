import os
import json
import requests
import uuid
import schedule
import time
import re
import argparse
from datetime import datetime
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

def extract_signals(posts, keyword):
    """Extrait les hashtags et musiques les plus fréquents parmi les posts."""
    hashtags_freq = {}
    music_freq = {}

    for post in posts:
        aweme_info = post.get('aweme_info', {})
        
        # 1. Extraction Hashtags
        cha_list = aweme_info.get('cha_list', []) or []
        for cha in cha_list:
            name = cha.get('hashtag_name')
            if name and name.lower() != keyword.lower():
                hashtags_freq[name] = hashtags_freq.get(name, 0) + 1
        
        # Si cha_list est vide, tenter de parser le desc
        if not cha_list:
            desc = aweme_info.get('desc', '')
            found_hashtags = re.findall(r'#(\w+)', desc)
            for h in found_hashtags:
                if h.lower() != keyword.lower():
                    hashtags_freq[h] = hashtags_freq.get(h, 0) + 1

        # 2. Extraction Musique
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

    # Tri et sélection du Top 3
    top_hashtags = sorted(hashtags_freq.items(), key=lambda x: x[1], reverse=True)[:3]
    weak_signals_hashtags = [{"name": name, "count": count} for name, count in top_hashtags]

    top_music = sorted(music_freq.values(), key=lambda x: x["count"], reverse=True)[:3]
    weak_signals_music = top_music

    return weak_signals_hashtags, weak_signals_music

def calculate_trend_status(current_views, previous_views, original_post_at=None):
    """Calcule le statut du cycle de vie basé sur la vélocité (vues/jour) et le momentum."""
    now = datetime.now()
    
    # 1. Calcul de l'âge et de la vélocité
    if original_post_at:
        # Assurer que original_post_at est un datetime
        if isinstance(original_post_at, (int, float)):
            original_post_at = datetime.fromtimestamp(original_post_at)
        
        delta = now - original_post_at.replace(tzinfo=None) # Simplification pour comparaison
        days = max(1, delta.days) # Plancher de 1 jour
    else:
        days = 1
    
    velocity = current_views / days # Vues par jour (Vq)

    # 2. Logique de décision (Matrice de Vélocité)
    
    # Cas de croissance forte détectée via Snapshot (J-1)
    if previous_views > 0:
        growth = (current_views - previous_views) / previous_views
        if growth > 0.3:
            return "EN_HAUSSE"

    # Cas VIRAL : Explosion immédiate (< 3 jours) et forte vélocité
    if original_post_at and days <= 3 and velocity > 100000:
        return "VIRAL"
    
    # Cas EMERGENT : Niche récente (< 5 jours)
    if original_post_at and days <= 5 and velocity > 10000:
        return "EMERGENT"
    
    # Cas STABLE : Post établi ou vélocité modérée
    if days > 10 or velocity > 5000:
        return "STABLE"
    
    # Cas EN_BAISSE : Vieux post avec faible vélocité
    if days > 15 and velocity < 2000:
        return "EN_BAISSE"
    
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

def insert_to_db(connection, title, total_views, platform_name, category, hashtags, music, description=None, context=None, age_dist=None, original_post_at=None, dry_run=False):
    """Insère ou met à jour la tendance, gère les snapshots et calcule le statut."""
    clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', title)[:100] or f"Trend {category}"
    slug = re.sub(r'[^a-z0-9]+', '-', clean_title.lower()).strip('-')
    if not slug: slug = f"trend-{uuid.uuid4().hex[:8]}"

    previous_views = 0
    existing = None

    if not dry_run:
        prev_query = text("SELECT score_base, status FROM trends WHERE slug = :slug")
        existing = connection.execute(prev_query, {"slug": slug}).fetchone()
        
        if existing:
            previous_views = existing.score_base
            snapshot_query = text("""
                INSERT INTO trends_snapshots (id, trend_slug, views_count, recorded_at)
                VALUES (:id, :slug, :views, NOW())
            """)
            connection.execute(snapshot_query, {"id": str(uuid.uuid4()), "slug": slug, "views": previous_views})
    else:
        previous_views = 500000 

    # Normalisation forcée en majuscules pour l'Enum DB
    new_status = calculate_trend_status(total_views, previous_views, original_post_at=original_post_at).upper()

    if dry_run:
        print(f"🧪 [DRY-RUN] Serait inséré : {clean_title} | Status: {new_status} | Vues: {total_views} | Age: {age_dist is not None} | Date Post: {original_post_at}")
        return

    # Utilisation d'un SQL robuste avec casting JSONB manuel là où c'est nécessaire pour l'agrégation
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
        SET score_base = EXCLUDED.score_base,
            status = EXCLUDED.status,
            platforms = (
                SELECT jsonb_agg(DISTINCT x) 
                FROM jsonb_array_elements(COALESCE(trends.platforms::jsonb, '[]'::jsonb) || EXCLUDED.platforms::jsonb) t(x)
            ),
            weak_signals_hashtags = EXCLUDED.weak_signals_hashtags,
            weak_signals_music = EXCLUDED.weak_signals_music,
            age_distribution = COALESCE(EXCLUDED.age_distribution, trends.age_distribution),
            original_post_at = COALESCE(EXCLUDED.original_post_at, trends.original_post_at);
    """)
    
    connection.execute(query, {
        "id": str(uuid.uuid4()), 
        "title": clean_title, 
        "slug": slug,
        "description": description or f"Analyse de la tendance émergente {clean_title}.",
        "context": context or "Détecté via l'analyse des signaux faibles TikTok.",
        "usage_example": f"Utilisez #{hashtags[0]['name']} si applicable." if hashtags else "Intégrez cette tendance dans votre prochain contenu.",
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
    print(f"✅ [{platform_name.upper()}] '{clean_title}' ({new_status}) synchronisé. Vues: {total_views} (+{total_views-previous_views if existing else 0})")

GENERIC_HASHTAGS = {"fyp", "viral", "foryou", "trending", "tiktok", "pourtoi", "trend", "explore", "video"}

def identify_trend_name(posts, category_keyword):
    """Identifie le nom le plus représentatif pour la tendance."""
    # 1. Tenter de récupérer le search_desc du premier post (très qualitatif sur TikTok)
    top_post = posts[0].get('aweme_info', {})
    search_desc = top_post.get('search_desc')
    if search_desc and len(search_desc) > 3:
        return search_desc.strip().title()

    # 2. Analyser les hashtags des 20 vidéos pour trouver le leader
    hashtag_counts = {}
    for post in posts:
        cha_list = post.get('aweme_info', {}).get('cha_list', []) or []
        for cha in cha_list:
            name = cha.get('hashtag_name', '').lower()
            if name and name not in GENERIC_HASHTAGS:
                hashtag_counts[name] = hashtag_counts.get(name, 0) + 1
    
    if hashtag_counts:
        top_tag = sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[0][0]
        # Nettoyage : cottage_core -> Cottage Core
        return top_tag.replace('_', ' ').replace('-', ' ').title()

    # 3. Fallback sur le mot-clé de la catégorie
    return category_keyword.title()

def scrape_tiktok(category, dry_run=False):
    """Récupère et analyse les signaux faibles TikTok pour une catégorie donnée."""
    if not API_KEY and not dry_run:
        print("❌ ERREUR: API_KEY manquante.")
        return

    keyword = CATEGORY_MAPPING.get(category, category.lower())
    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] {'[DRY-RUN] ' if dry_run else ''}Analyse TikTok pour '{category}' (Mot-clé: {keyword})...", flush=True)
    
    try:
        if dry_run:
            raw_json = {
                "data": [
                    {
                        "aweme_info": {
                            "desc": f"Ceci est une simulation de tendance pour {category} #test",
                            "statistics": {"play_count": 1250000},
                            "author": {"unique_id": "user_test"},
                            "music": {"id_str": "123", "title": "Mock Music", "author": "Mock Artist"},
                            "cha_list": [{"hashtag_name": "test"}]
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
            hashtags, music = extract_signals(sample_posts, keyword)
            
            top_post = sample_posts[0]
            aweme_info = top_post.get('aweme_info', {})
            author = aweme_info.get('author', {})
            username = author.get('unique_id')
            
            statistics = aweme_info.get('statistics', {})
            raw_views = statistics.get('play_count', 0)
            
            # Application du Naming Pipeline (Claude's Strategy)
            title = identify_trend_name(sample_posts, keyword)
            
            description = aweme_info.get('desc')
            
            # Extraction de la date de publication originale
            create_time = aweme_info.get('create_time')
            original_post_at = datetime.fromtimestamp(create_time) if create_time else None
            
            # --- STRATÉGIE BUDGET SAFE RESTAURÉE ---
            age_dist = None
            if dry_run:
                age_dist = fetch_audience_demographics(username, dry_run=True)
            else:
                remaining_credits = get_api_usage()
                # On n'enrichit l'audience (26 crédits) que si le budget est confortable (> 30)
                if remaining_credits > 30 and username:
                    age_dist = fetch_audience_demographics(username)
            
            if dry_run:
                insert_to_db(None, title, int(raw_views), "tiktok", category, hashtags, music, description=description, age_dist=age_dist, original_post_at=original_post_at, dry_run=True)
            else:
                engine = create_engine(DB_URL)
                with engine.connect() as conn:
                    insert_to_db(conn, title, int(raw_views), "tiktok", category, hashtags, music, description=description, age_dist=age_dist, original_post_at=original_post_at)
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
        # Lancement immédiat en PROD
        run_all_categories()
        
        # Planification pour le futur
        schedule.every().day.at("04:00").do(run_all_categories)
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        run_all_categories(dry_run=True)
        print("🧪 Dry-run terminé avec succès.")

if __name__ == "__main__":
    main()
