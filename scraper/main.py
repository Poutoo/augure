import os
import time
import re
import json
import requests
import uuid
import schedule
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def generate_slug(title):
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    return slug

def scrape_youtube_and_save():
    print("📺 Récupération YouTube...", flush=True)
    api_key = os.getenv("YOUTUBE_API_KEY")
    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    
    if not api_key: return
    
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {"part": "snippet,statistics", "chart": "mostPopular", "regionCode": "FR", "maxResults": 5, "key": api_key}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        engine = create_engine(db_url)
        
        with engine.connect() as connection:
            for item in data.get("items", []):
                title = item["snippet"]["title"]
                description = item["snippet"].get("description", "") 
                views = int(item["statistics"].get("viewCount", 0))
                slug = generate_slug(title)
                platforms_json = json.dumps(["youtube"])

                query = text("""
                    INSERT INTO trends (id, title, slug, description, context, usage_example, score_base, platforms, status)
                    VALUES (:id, :title, :slug, :description, :context, :usage_example, :score, :platforms, 'Viral')
                    ON CONFLICT (slug) DO UPDATE SET score_base = EXCLUDED.score_base;
                """)
                connection.execute(query, {
                    "id": str(uuid.uuid4()), "title": title, "slug": slug, "description": description,
                    "context": "", "usage_example": "", "score": views, "platforms": platforms_json
                })
                
                query_snapshot = text("INSERT INTO trends_snapshots (trend_slug, score) VALUES (:slug, :score);")
                connection.execute(query_snapshot, {"slug": slug, "score": views})
                
            connection.commit()
            print("✅ SUCCÈS : YouTube synchronisé !", flush=True)
    except Exception as e:
        print(f"❌ ERREUR YouTube : {e}", flush=True)

def scrape_tiktok_and_save():
    print("📱 Récupération TikTok (EnsembleData)...", flush=True)
    api_key = os.getenv("ENSEMBLEDATA_API_KEY")
    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    
    if not api_key: return

    TARGET_KEYWORDS = ["cottagecore", "gorpcore", "old money aesthetic", "matcha", "y2k fashion", "techwear", "dark academia", "quiet luxury", "barbiecore", "tasty crousty"]
    engine = create_engine(db_url)
    
    with engine.connect() as connection:
        for keyword in TARGET_KEYWORDS:
            try:
                url = "https://ensembledata.com/apis/tt/keyword/search"
                params = {"name": keyword, "period": "1", "sorting": "0", "token": api_key}
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                posts = data.get("data", {}).get("data", [])
                if not posts: continue
                
                total_views = sum(int(p.get('statistics', p.get('stats', {})).get('playCount', 0)) for p in posts)
                slug = generate_slug(keyword)
                
                query_parent = text("""
                    INSERT INTO trends (id, title, slug, description, context, usage_example, score_base, platforms, status)
                    VALUES (:id, :title, :slug, '', '', '', :score, :platforms, 'Viral')
                    ON CONFLICT (slug) DO UPDATE SET score_base = EXCLUDED.score_base;
                """)
                connection.execute(query_parent, {
                    "id": str(uuid.uuid4()), "title": keyword.title(), "slug": slug, 
                    "score": total_views, "platforms": json.dumps(["tiktok"])
                })
                
                query_child = text("INSERT INTO trends_snapshots (trend_slug, score) VALUES (:slug, :score);")
                connection.execute(query_child, {"slug": slug, "score": total_views})
                
            except Exception as e:
                print(f"❌ ERREUR TikTok pour {keyword}: {e}", flush=True)
                
        connection.commit()
        print("✅ SUCCÈS : TikTok synchronisé !", flush=True)

def main():
    print("🚀 Démarrage de l'orchestrateur Augure...", flush=True)

    scrape_youtube_and_save()
    
    # ⚠️ TikTok est désactivé au démarrage pour économiser les tokens !
    # scrape_tiktok_and_save() 

    schedule.every(1).hours.do(scrape_youtube_and_save) 
    schedule.every().day.at("03:00").do(scrape_tiktok_and_save) 

    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()