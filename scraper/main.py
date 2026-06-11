import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

def test_db_connection():
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        print("❌ ERREUR : La variable DATABASE_URL est introuvable.", flush=True)
        return False
        
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    try:
        engine = create_engine(db_url)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            print("✅ SUCCÈS : Connexion à Supabase validée en IPv4 !", flush=True)
            return True
    except Exception as e:
        print(f"❌ ERREUR de connexion : {e}", flush=True)
        return False

def main():
    print("🚀 Démarrage du scraper Augure...", flush=True)

    while True:
        print("🔍 Test de connexion en cours...", flush=True)
        test_db_connection()
        print("⏳ En attente pour le prochain cycle (60s)...", flush=True)
        time.sleep(60)

if __name__ == "__main__":
    main()