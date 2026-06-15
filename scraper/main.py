import os
import json
import requests
import uuid
import schedule
import re
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

API_KEY = os.getenv("ENSEMBLEDATA_API_KEY")
DB_URL = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)

def check_api_usage():
    if not API_KEY: return
    today = datetime.now().strftime("%Y-%m-%d")
    try:
        res = requests.get("https://ensembledata.com/apis/customer/get-used-units", 
                           params={"date": today, "token": API_KEY})
        if res.status_code == 200:
            print(f"📊 [MONITORING] Tokens utilisés : {sum(res.json().get('data', {}).values())}")
    except: pass

def insert_top_trend(connection, title, total_views, platform_name):
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')

    query = text("""
        INSERT INTO trends (id, title, slug, score_base, platforms, status)
        VALUES (:id, :title, :slug, :score, :platforms, 'VIRAL')
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = trends.score_base + EXCLUDED.score_base,
            platforms = trends.platforms || EXCLUDED.platforms;
    """)
    connection.execute(query, {
        "id": str(uuid.uuid4()), "title": title, "slug": slug, 
        "score": total_views, "platforms": json.dumps([platform_name])
    })

    query_snap = text("INSERT INTO trends_snapshots (trend_slug, score, platform) VALUES (:slug, :score, :platform);")
    connection.execute(query_snap, {"slug": slug, "score": total_views, "platform": platform_name})
    print(f"✅ [{platform_name.upper()}] Enregistré : '{title[:30]}...' | Vues : {total_views}")

def scrape_tiktok_trending():
    print("📱 [TIKTOK] Récupération du TOP tendance...")
    url = "https://ensembledata.com/apis/tt/hashtag/recent-posts"

    params = {"name": "trending", "token": API_KEY}
    
    try:
        res = requests.get(url, params=params)
        posts = res.json().get("data", {}).get("posts", [])
        if posts:

            top_post = max(posts, key=lambda x: int(x.get('stats', {}).get('playCount', 0)))
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_top_trend(conn, top_post.get("title", "Tendance TikTok"), 
                                 int(top_post.get("stats", {}).get("playCount", 0)), "tiktok")
                conn.commit()
    except Exception as e: print(f"❌ Erreur TikTok: {e}")

def scrape_youtube_trending():
    print("▶️ [YOUTUBE] Récupération du TOP Short...")
    url = "https://ensembledata.com/apis/youtube/hashtag/search"

    params = {"name": "shorts", "depth": 1, "only_shorts": True, "token": API_KEY}
    
    try:
        res = requests.get(url, params=params)
        videos = res.json().get("data", {}).get("videos", [])
        if videos:

            top_vid = max(videos, key=lambda x: int(x.get('view_count', 0)))
            engine = create_engine(DB_URL)
            with engine.connect() as conn:
                insert_top_trend(conn, top_vid.get("title", "Tendance YT Shorts"), 
                                 int(top_vid.get("view_count", 0)), "youtube_shorts")
                conn.commit()
    except Exception as e: print(f"❌ Erreur YouTube: {e}")

def main():
    print("🚀 Orchestrateur Augure activé (Mode découverte auto)...")
    check_api_usage()

    scrape_tiktok_trending()
    scrape_youtube_trending()

    schedule.every().day.at("04:00").do(scrape_tiktok_trending)
    schedule.every().day.at("04:05").do(scrape_youtube_trending)
    
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()