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

    clean_title = re.sub(r'[^a-zA-Z0-9 ]', '', title)[:50]
    slug = re.sub(r'[^a-z0-9]+', '-', clean_title.lower()).strip('-')

    query = text("""
        INSERT INTO trends (id, title, slug, score_base, platforms, status)
        VALUES (:id, :title, :slug, :score, :platforms, 'VIRAL')
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = trends.score_base + EXCLUDED.score_base,
            platforms = trends.platforms || EXCLUDED.platforms;
    """)
    connection.execute(query, {
        "id": str(uuid.uuid4()), 
        "title": clean_title, 
        "slug": slug, 
        "score": total_views, 
        "platforms": json.dumps([platform_name])
    })
    
    query_snap = text("INSERT INTO trends_snapshots (trend_slug, score, platform) VALUES (:slug, :score, :platform);")
    connection.execute(query_snap, {"slug": slug, "score": total_views, "platform": platform_name})
    print(f"✅ [{platform_name.upper()}] Enregistré : '{clean_title}' | Vues : {total_views}")

def scrape_tiktok():
    print("📱 [TIKTOK] Analyse des tendances en cours...", flush=True)
    
    try:
        trending_res = requests.get("https://ensembledata.com/apis/tt/hashtag/trending", params={"token": API_KEY})
        hashtags = trending_res.json().get("data", {}).get("hashtags", [])
        if not hashtags: return

        top_hashtag = hashtags[0].get("name")
        print(f"🔥 Hashtag détecté : #{top_hashtag}")

        search_res = requests.get("https://ensembledata.com/apis/tt/keyword/search", 
                                  params={"name": top_hashtag, "period": "7", "sorting": "1", "token": API_KEY})
        posts = search_res.json().get("data", {}).get("data", [])
        
        if posts:
            top_post = max(posts, key=lambda x: int(x.get('statistics', {}).get('playCount', 0)))
            
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_to_db(conn, top_post.get("desc", "Tendance Sans Nom"), 
                             int(top_post.get("statistics", {}).get('playCount', 0)), "tiktok")
                conn.commit()
    except Exception as e: print(f"❌ Erreur critique: {e}")

def main():
    print("🚀 Orchestrateur Augure activé.")
    scrape_tiktok()
    
    schedule.every().day.at("04:00").do(scrape_tiktok)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()