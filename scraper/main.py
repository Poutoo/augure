import os
import time
import re
import json
import requests
import uuid
import schedule
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

TARGET_KEYWORDS = ["cottagecore", "gorpcore", "old money aesthetic", "matcha", "y2k fashion", "techwear", "dark academia", "quiet luxury", "barbiecore", "tasty crousty"]

def generate_slug(title):
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    return slug

def check_api_usage():

    api_key = os.getenv("ENSEMBLEDATA_API_KEY")
    if not api_key: return
    
    today = datetime.now().strftime("%Y-%m-%d")
    url = "https://ensembledata.com/apis/customer/get-used-units"
    params = {"date": today, "token": api_key}
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json().get("data", {})
            total_used = sum(data.values()) if isinstance(data, dict) else 0
            print(f"📊 [MONITORING] Tokens utilisés aujourd'hui ({today}) : {total_used} unités.", flush=True)
    except Exception as e:
        print(f"⚠️ Impossible de vérifier les tokens : {e}")

def insert_trend_to_db(connection, keyword, total_views, platform_name):

    slug = generate_slug(keyword)
    platforms_json = json.dumps([platform_name])

    query_parent = text("""
        INSERT INTO trends (id, title, slug, description, context, usage_example, score_base, platforms, status)
        VALUES (:id, :title, :slug, DEFAULT, :context, :usage_example, :score, :platforms, 'VIRAL')
        ON CONFLICT (slug) DO UPDATE 
        SET score_base = trends.score_base + EXCLUDED.score_base,
            platforms = trends.platforms || EXCLUDED.platforms;
    """)
    connection.execute(query_parent, {
        "id": str(uuid.uuid4()), 
        "title": keyword.title(), 
        "slug": slug, 
        "context": "", 
        "usage_example": "", 
        "score": total_views, 
        "platforms": platforms_json
    })
    
    query_child = text("INSERT INTO trends_snapshots (trend_slug, score, platform) VALUES (:slug, :score, :platform);")
    connection.execute(query_child, {"slug": slug, "score": total_views, "platform": platform_name})


def scrape_tiktok_and_save():
    print("📱 [TIKTOK] Récupération en cours...", flush=True)
    api_key = os.getenv("ENSEMBLEDATA_API_KEY")
    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    if not api_key: return

    engine = create_engine(db_url)
    with engine.connect() as connection:
        for keyword in TARGET_KEYWORDS:
            try:

                url = "https://ensembledata.com/apis/tt/keyword/search"
                params = {"name": keyword, "period": "1", "sorting": "0", "token": api_key}
                response = requests.get(url, params=params)
                if response.status_code != 200: continue
                
                posts = response.json().get("data", {}).get("data", [])
                if not posts: continue
                
                total_views = sum(int(p.get('statistics', p.get('stats', {})).get('playCount', 0)) for p in posts)
                insert_trend_to_db(connection, keyword, total_views, "tiktok")
                
            except Exception as e:
                print(f"❌ ERREUR TikTok pour {keyword}: {e}", flush=True)
        connection.commit()
        print("✅ SUCCÈS : TikTok synchronisé !", flush=True)


def scrape_youtube_shorts_and_save():
    print("▶️ [YOUTUBE] Récupération Shorts en cours...", flush=True)
    api_key = os.getenv("ENSEMBLEDATA_API_KEY")
    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    if not api_key: return

    engine = create_engine(db_url)
    with engine.connect() as connection:
        for keyword in TARGET_KEYWORDS:

            hashtag = keyword.replace(" ", "")
            try:
                
                url = "https://ensembledata.com/apis/youtube/hashtag/search" 
                params = {
                    "name": hashtag, 
                    "depth": 1, 
                    "only_shorts": True,
                    "token": api_key
                }
                response = requests.get(url, params=params)
                if response.status_code != 200: continue
                
                videos = response.json().get("data", {}).get("videos", [])
                if not videos: continue

                total_views = sum(int(v.get('view_count', v.get('views', 0))) for v in videos)
                insert_trend_to_db(connection, keyword, total_views, "youtube_shorts")
                
            except Exception as e:
                print(f"❌ ERREUR YouTube pour {keyword}: {e}", flush=True)
        connection.commit()
        print("✅ SUCCÈS : YouTube Shorts synchronisé !", flush=True)


def main():
    print("🚀 Démarrage de l'orchestrateur Augure...", flush=True)

    check_api_usage()

    schedule.every(4).hours.do(scrape_tiktok_and_save) 
   
    schedule.every().day.at("04:00").do(scrape_youtube_shorts_and_save) 

    print("⏳ Planificateur activé. En attente du prochain cycle...")

    scrape_tiktok_and_save()
    scrape_youtube_shorts_and_save()

    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()