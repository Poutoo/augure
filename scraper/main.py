import os
import json
import requests
import uuid
import re
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

API_KEY = os.getenv("ENSEMBLEDATA_API_KEY")
DB_URL = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)

def insert_to_db(connection, title, total_views):

    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    
    query = text("""
        INSERT INTO trends (id, title, slug, score_base, platforms, status)
        VALUES (:id, :title, :slug, :score, '["tiktok"]', 'VIRAL')
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = EXCLUDED.score_base;
    """)
    connection.execute(query, {
        "id": str(uuid.uuid4()), "title": title, "slug": slug, "score": total_views
    })
    
    query_snap = text("INSERT INTO trends_snapshots (trend_slug, score, platform) VALUES (:slug, :score, 'tiktok');")
    connection.execute(query_snap, {"slug": slug, "score": total_views})
    print(f"✅ Enregistré : '{title[:50]}...' | Vues : {total_views}")

def scrape_tiktok_growth():
    print("📱 [TIKTOK] Recherche du top post (7 jours)...")
    url = "https://ensembledata.com/apis/tt/keyword/search"

    params = {"name": "mode", "period": "7", "sorting": "1", "token": API_KEY}
    
    try:
        res = requests.get(url, params=params)
        data = res.json().get("data", {}).get("data", [])
        
        if data:

            top_post = max(data, key=lambda x: int(x.get('statistics', {}).get('playCount', 0)))
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, top_post.get("desc", "Tendance TikTok"), 
                             int(top_post.get("statistics", {}).get("playCount", 0)))
                conn.commit()
    except Exception as e:
        print(f"❌ Erreur API: {e}")

if __name__ == "__main__":
    scrape_tiktok_growth()