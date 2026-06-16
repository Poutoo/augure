import os
import json
import requests
import uuid
import schedule
import time
import re
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

def insert_to_db(connection, title, total_views, platform_name, category, hashtags, music, description=None, context=None):
    """Insère ou met à jour la tendance avec les signaux faibles."""
    clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', title)[:100] or f"Trend {category}"
    slug = re.sub(r'[^a-z0-9]+', '-', clean_title.lower()).strip('-')
    if not slug: slug = f"trend-{uuid.uuid4().hex[:8]}"

    query = text("""
        INSERT INTO trends (
            id, title, slug, description, context, usage_example, 
            score_base, platforms, status, category, 
            weak_signals_hashtags, weak_signals_music, created_at
        )
        VALUES (
            :id, :title, :slug, :description, :context, :usage_example, 
            :score, :platforms, 'EMERGENT', :category, 
            :hashtags, :music, NOW()
        )
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = trends.score_base + EXCLUDED.score_base,
            platforms = (
                SELECT jsonb_agg(DISTINCT x) 
                FROM jsonb_array_elements(COALESCE(trends.platforms, '[]'::jsonb) || EXCLUDED.platforms) t(x)
            ),
            weak_signals_hashtags = EXCLUDED.weak_signals_hashtags,
            weak_signals_music = EXCLUDED.weak_signals_music;
    """)
    
    # Note: platforms is handled simply as a JSON list for now, we could use jsonb_set for merge but staying simple
    
    connection.execute(query, {
        "id": str(uuid.uuid4()), 
        "title": clean_title, 
        "slug": slug,
        "description": description or f"Analyse de la tendance émergente {clean_title}.",
        "context": context or "Détecté via l'analyse des signaux faibles TikTok.",
        "usage_example": f"Utilisez #{hashtags[0]['name']} si applicable." if hashtags else "Intégrez cette tendance dans votre prochain contenu.",
        "score": total_views, 
        "platforms": json.dumps([platform_name]),
        "category": category,
        "hashtags": json.dumps(hashtags),
        "music": json.dumps(music)
    })
    connection.commit()
    print(f"✅ [{platform_name.upper()}] '{clean_title}' synchronisé avec {len(hashtags)} hashtags et {len(music)} musiques.")

def scrape_tiktok(category):
    """Récupère et analyse les signaux faibles TikTok pour une catégorie donnée."""
    if not API_KEY:
        print("❌ ERREUR: API_KEY manquante.")
        return

    keyword = CATEGORY_MAPPING.get(category, category.lower())
    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] Analyse TikTok pour '{category}' (Mot-clé: {keyword})...", flush=True)
    
    try:
        url = "https://ensembledata.com/apis/tt/keyword/search"
        params = {"name": keyword, "period": "7", "sorting": "1", "token": API_KEY}
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        raw_json = response.json()
        # Extraction robuste des posts
        posts = raw_json.get("data", [])
        if isinstance(posts, dict):
            posts = posts.get("data", [])
            
        if posts:
            # On prend les 20 premiers posts pour l'analyse de signaux faibles
            sample_posts = posts[:20]
            
            # Extraction des signaux
            hashtags, music = extract_signals(sample_posts, keyword)
            
            # Données du post principal pour la tendance
            top_post = sample_posts[0]
            aweme_info = top_post.get('aweme_info', {})
            statistics = aweme_info.get('statistics', {})
            raw_views = statistics.get('play_count', 0)
            title = aweme_info.get('search_desc') or aweme_info.get('desc') or f"Tendance {category}"
            description = aweme_info.get('desc')
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(
                    conn, 
                    title, 
                    int(raw_views), 
                    "tiktok", 
                    category, 
                    hashtags, 
                    music,
                    description=description
                )
        else:
            print(f"⚠️ Aucune donnée pour '{category}'.")
    except Exception as e:
        print(f"❌ Erreur sur '{category}' : {e}")

def run_all_categories():
    """Parcourt toutes les catégories."""
    for category in CATEGORY_MAPPING.keys():
        scrape_tiktok(category)
        time.sleep(2) # Délai réduit

def main():
    print("🚀 Orchestrateur Augure prêt.")
    get_api_stats()
    
    if SKIP_AUTO_RUN:
        print("⏸️ Mode debug : Lancement auto ignoré.")
    else:
        run_all_categories()
    
    schedule.every().day.at("04:00").do(run_all_categories)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
