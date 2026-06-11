import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

def test_youtube_api():
    print("📺 Test de connexion à l'API YouTube...", flush=True)
    api_key = os.getenv("YOUTUBE_API_KEY")
    
    if not api_key:
        print("❌ ERREUR : La clé YOUTUBE_API_KEY est introuvable.", flush=True)
        return

    # Configuration de la requête API YouTube
    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet,statistics", # On demande le titre (snippet) et les vues (statistics)
        "chart": "mostPopular",       # Le filtre des tendances
        "regionCode": "FR",           # Localisation : France
        "maxResults": 5,              # On limite à 5 pour le test
        "key": api_key
    }

    try:
        # On envoie la requête à Google
        response = requests.get(url, params=params)
        response.raise_for_status() # Déclenche une erreur si la clé est invalide ou le quota dépassé
        
        data = response.json()
        print("✅ SUCCÈS : Voici les 5 vidéos tendances actuelles sur YouTube FR :", flush=True)
        
        # On boucle sur les résultats pour les afficher proprement
        for item in data.get("items", []):
            title = item["snippet"]["title"]
            views = item["statistics"].get("viewCount", "0")
            channel = item["snippet"]["channelTitle"]
            print(f"   🎬 {title} | 👤 {channel} | 👀 {views} vues", flush=True)
            
    except Exception as e:
        print(f"❌ ERREUR de l'API YouTube : {e}", flush=True)

def main():
    print("🚀 Démarrage du scraper Augure (Mode test YouTube)...", flush=True)

    while True:
        test_youtube_api()
        print("⏳ En attente pour le prochain cycle (60s)...", flush=True)
        time.sleep(60)

if __name__ == "__main__":
    main()