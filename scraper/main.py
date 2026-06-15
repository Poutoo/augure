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

load_dotenv()

API_KEY = os.getenv("ENSEMBLEDATA_API_KEY")
DB_URL = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)

def insert_to_db(connection, title, total_views, platform_name):

    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    
    query = text("""
        INSERT INTO trends (id, title, slug, score_base, platforms, status)
        VALUES (:id, :title, :slug, :score, :platforms, 'VIRAL')
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = trends.score_base + EXCLUDED.score_base,
            platforms = trends.platforms || EXCLUDED.platforms;
    """)
    connection.execute(query, {
        "id": str(uuid.uuid4()), 
        "title": title, 
        "slug": slug, 
        "score": total_views, 
        "platforms": json.dumps([platform_name])
    })
    

    query_snap = text("INSERT INTO trends_snapshots (trend_slug, score, platform) VALUES (:slug, :score, :platform);")
    connection.execute(query_snap, {"slug": slug, "score": total_views, "platform": platform_name})
    print(f"✅ [{platform_name.upper()}] Enregistré : '{title[:50]}...' | Vues : {total_views}")

def scrape_tiktok():
    print("📱 [TIKTOK] Récupération...", flush=True)

    url = "https://ensembledata.com/apis/tt/keyword/search"
    params = {"name": "mode", "period": "7", "sorting": "1", "token": API_KEY}
    
    try:
        res = requests.get(url, params=params)
        posts = res.json().get("data", {}).get("data", [])
        if posts:
            top_post = max(posts, key=lambda x: int(x.get('statistics', {}).get('playCount', 0)))
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, top_post.get("desc", "Tendance TikTok"), 
                             int(top_post.get("statistics", {}).get('playCount', 0)), "tiktok")
                conn.commit()
    except Exception as e: print(f"❌ Erreur TikTok: {e}")

def main():
    print("🚀 Orchestrateur Augure prêt.")

    scrape_tiktok()
    

    schedule.every().day.at("05:00").do(scrape_tiktok)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()