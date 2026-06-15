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

def scrape_tiktok(category):
    """Récupère une tendance TikTok pour une catégorie donnée."""
    if not API_KEY:
        print("❌ ERREUR: API_KEY manquante.")
        return

    keyword = CATEGORY_MAPPING.get(category, category.lower())
    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] Recherche TikTok pour '{category}' (Mot-clé: {keyword})...", flush=True)
    
    try:
        url = "https://ensembledata.com/apis/tt/keyword/search"
        params = {"name": keyword, "period": "7", "sorting": "1", "token": API_KEY}
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        raw_json = response.json()
        posts = raw_json.get("data", []) if isinstance(raw_json.get("data"), list) else raw_json.get("data", {}).get("data", [])
        if not posts and isinstance(raw_json, list):
            posts = raw_json

        if posts:
            top_post = posts[0]
            aweme_info = top_post.get('aweme_info', {})
            statistics = aweme_info.get('statistics', {})
            raw_views = statistics.get('play_count', 0)
            title = aweme_info.get('search_desc') or aweme_info.get('desc') or f"Tendance {category}"
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, title, int(raw_views), "tiktok")
        else:
            print(f"⚠️ Aucune donnée pour '{category}'.")
    except Exception as e:
        print(f"❌ Erreur sur '{category}' : {e}")

def run_all_categories():
    """Parcourt toutes les catégories."""
    for category in CATEGORY_MAPPING.keys():
        scrape_tiktok(category)
        time.sleep(5) # Sécurité pour ne pas saturer l'API

def main():
    print("🚀 Orchestrateur Augure prêt.")
    get_api_stats()
    
    if not SKIP_AUTO_RUN:
        run_all_categories()
    else:
        print("⏸️ Mode debug : Lancement auto ignoré.")
    
    schedule.every().day.at("04:00").do(run_all_categories)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()