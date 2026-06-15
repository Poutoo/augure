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
    """Récupère une tendance réelle avec logs de debug ultra-précis."""
    if not API_KEY:
        print("❌ ERREUR: API_KEY manquante.")
        return

    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] Lancement recherche TikTok...", flush=True)
    
    try:
        url = "https://ensembledata.com/apis/tt/keyword/search"
        params = {"name": "fashion", "period": "7", "sorting": "1", "token": API_KEY}
        
        response = requests.get(url, params=params, timeout=20)
        response.raise_for_status()
        
        # --- DEBUG RADICAL ---
        raw_json = response.json()
        print(f"DEBUG_STRUCTURE: {list(raw_json.keys())}", flush=True)
        print(f"DEBUG_DATA_CONTENT: {raw_json.get('data')}", flush=True)
        # ---------------------
        
        posts = raw_json.get("data", {}).get("data", [])
        
        if posts:
            # On prend la vidéo la plus vue
            top_post = max(posts, key=lambda x: int(x.get('statistics', {}).get('playCount', 0)))
            
            # Debug des vues trouvées
            raw_views = top_post.get('statistics', {}).get('playCount', 0)
            print(f"DEBUG: Vues trouvées pour '{top_post.get('desc')[:20]}...' : {raw_views}")
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, top_post.get("desc", "Tendance Fashion"), 
                             int(raw_views), "tiktok")
        else:
            print("⚠️ Aucune donnée retournée dans le chemin ['data']['data'].")
            
    except Exception as e:
        print(f"❌ Erreur critique : {e}")
        
def main():
    print("🚀 Orchestrateur Augure prêt.")
    if not SKIP_AUTO_RUN:
        scrape_tiktok()
    else:
        print("⏸️ Mode debug activé : Lancement automatique ignoré.")
    
    schedule.every().day.at("04:00").do(scrape_tiktok)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()