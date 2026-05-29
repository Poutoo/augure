import os
import time
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def main():
    print("🚀 Démarrage du scraper Augure...")
    db_user = os.getenv("DB_USER")
    db_url = os.getenv("DATABASE_URL")
    
    # On simule un script qui tourne en tâche de fond
    while True:
        print("🔍 En attente de nouvelles tendances à scraper...")
        time.sleep(60)

if __name__ == "__main__":
    main()