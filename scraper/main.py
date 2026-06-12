import os
import time
import re
import json
import requests
import uuid
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def generate_slug(title):

    slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
    return slug

def scrape_youtube_and_save():
    print("📺 Récupération et sauvegarde des tendances YouTube...", flush=True)
    
    api_key = os.getenv("YOUTUBE_API_KEY")

    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    
    if not api_key:
        print("❌ ERREUR : Clé YouTube manquante.", flush=True)
        return

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,statistics",
        "chart": "mostPopular",
        "regionCode": "FR",
        "maxResults": 5,
        "key": api_key
    }

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
                    VALUES (:id, :title, :slug, :description, :context, :usage_example, :score, :platforms, :status)
                    ON CONFLICT (slug) DO UPDATE 
                    SET score_base = EXCLUDED.score_base;
                """)
                
                connection.execute(query, {
                    "id": str(uuid.uuid4()),
                    "title": title,
                    "slug": slug,
                    "description": description,
                    "context": "",            
                    "usage_example": "",      
                    "score": views,
                    "platforms": platforms_json,
                    "status": "viral"       
                })
                
            connection.commit()
            print("✅ SUCCÈS : Les tendances YouTube ont été synchronisées avec Supabase !", flush=True)
            
    except Exception as e:
        print(f"❌ ERREUR lors de la synchronisation : {e}", flush=True)

def main():
    print("🚀 Démarrage du scraper Augure (Production YouTube -> Supabase)...", flush=True)

    while True:
        scrape_youtube_and_save()
        print("⏳ En attente pour le prochain cycle (1 heure)...", flush=True)
        time.sleep(3600)

if __name__ == "__main__":
    main()