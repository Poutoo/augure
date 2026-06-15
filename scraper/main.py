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

def get_api_stats():
    """Affiche les crédits utilisés et totaux au démarrage."""
    url = "https://ensembledata.com/apis/customer/get-usage"
    try:
        response = requests.get(url, params={"token": API_KEY}, timeout=10)
        data = response.json().get("data", {})
        print(f"📊 [CRÉDITS] Utilisés : {data.get('used_units', 'N/A')} | Total : {data.get('total_units', 'N/A')}", flush=True)
    except Exception as e:
        print(f"⚠️ Impossible de récupérer les stats : {e}")

def insert_to_db(connection, title, total_views, platform_name):
    """Insère le post dans la BDD."""
    clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', title)[:50] or "Tendance Sans Nom"
    slug = re.sub(r'[^a-z0-9]+', '-', clean_title.lower()).strip('-')

    query = text("""
        INSERT INTO trends (id, title, slug, score_base, platforms, status)
        VALUES (:id, :title, :slug, :score, :platforms, 'VIRAL')
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = trends.score_base + EXCLUDED.score_base,
            platforms = trends.platforms || EXCLUDED.platforms;
    """)
    connection.execute(query, {
        "id": str(uuid.uuid4()), "title": clean_title, "slug": slug, 
        "score": total_views, "platforms": json.dumps([platform_name])
    })
    
    query_snap = text("INSERT INTO trends_snapshots (trend_slug, score, platform) VALUES (:slug, :score, :platform);")
    connection.execute(query_snap, {"slug": slug, "score": total_views, "platform": platform_name})
    connection.commit()
    print(f"✅ [{platform_name.upper()}] Enregistré : '{clean_title}' | Vues : {total_views}")

def scrape_tiktok():
    if not API_KEY:
        print("❌ ERREUR: API_KEY manquante.")
        return

    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] Lancement recherche TikTok...", flush=True)
    
    try:
        url = "https://ensembledata.com/apis/tt/keyword/search"
        params = {"name": "fashion", "period": "7", "sorting": "1", "token": API_KEY}
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        raw_json = response.json()
        
        posts = raw_json.get("data", []) if isinstance(raw_json.get("data"), list) else raw_json.get("data", {}).get("data", [])
        if not posts and isinstance(raw_json, list):
            posts = raw_json

        if posts:
            # DEBUG : On confirme que les données sont dans aweme_info
            top_post = posts[0]
            aweme_info = top_post.get('aweme_info', {})
            
            # On cherche les statistiques DANS aweme_info
            statistics = aweme_info.get('statistics', {})
            raw_views = statistics.get('play_count', 0)
            
            # On récupère le titre dans aweme_info
            title = aweme_info.get('search_desc') or aweme_info.get('desc') or "Tendance Fashion"
            
            print(f"DEBUG_AWEME_INFO_FOUND: {aweme_info is not None}", flush=True)
            print(f"✅ Vidéo sélectionnée : '{title[:30]}...' | Vues lues : {raw_views}")
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, title, int(raw_views), "tiktok")
        else:
            print("⚠️ Aucune vidéo trouvée dans la réponse.")
            
    except Exception as e:
        print(f"❌ Erreur critique : {e}")
        
def scrape_youtube_shorts():
    """Récupère une tendance YouTube Shorts."""
    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] Lancement recherche YouTube...", flush=True)
    
    try:
        # Endpoint spécifique YouTube pour EnsembleData
        url = "https://ensembledata.com/apis/yt/keyword/search" 
        params = {"name": "fashion", "period": "7", "sorting": "1", "token": API_KEY}
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        raw_json = response.json()
        
        # Les APIs YouTube retournent souvent les données dans une liste 'items'
        posts = raw_json.get("data", {}).get("items", [])
        
        if posts:
            top_post = posts[0]
            # YouTube utilise 'statistics' et 'snippet' comme structure standard
            stats = top_post.get('statistics', {})
            snippet = top_post.get('snippet', {})
            
            raw_views = stats.get('viewCount', 0)
            title = snippet.get('title', "Tendance YouTube")
            
            print(f"✅ Vidéo YT trouvée : '{title[:30]}...' | Vues : {raw_views}")
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, title, int(raw_views), "youtube")
        else:
            print("⚠️ Aucune vidéo YouTube trouvée.")
            
    except Exception as e:
        print(f"❌ Erreur YouTube : {e}")
        
def main():
    print("🚀 Orchestrateur Augure prêt.")
    get_api_stats()
    if not SKIP_AUTO_RUN:
        # scrape_tiktok()
        scrape_youtube_shorts()
    else:
        print("⏸️ Mode debug activé : Lancement automatique ignoré.")
    
    # schedule.every().day.at("04:00").do(scrape_tiktok)
    schedule.every().day.at("04:00").do(scrape_youtube_shorts)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()