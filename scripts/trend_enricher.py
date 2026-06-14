import os
import requests
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from duckduckgo_search import DDGS

load_dotenv()

def search_web_context(query):

    try:

        results = DDGS().text(query, region='fr-fr', safesearch='off', max_results=2)
        if not results:
            return "Aucune information pertinente trouvée."
        

        context = " ".join([res['body'] for res in results])
        return context
    except Exception as e:
        print(f"⚠️ Erreur lors de la recherche web : {e}")
        return "Impossible de faire la recherche web."

def get_ai_description(title):
    print(f"   🔍 Recherche web en cours pour : '{title}'...")
    web_context = search_web_context(title)

    url = "http://localhost:11434/api/generate"
    payload = {
        "model": "llama3",
        "system": "Tu es un expert en culture web, réseaux sociaux (TikTok, YouTube) et divertissement. Ta mission est d'expliquer l'origine ou le concept d'une tendance en te basant STRICTEMENT sur les informations web fournies.\n\nRÈGLES ABSOLUES :\n1. Rédige EXCLUSIVEMENT en français.\n2. Sois factuel en utilisant le contexte fourni.\n3. Ne renvoie QUE la définition brute.\n4. INTERDICTION d'utiliser des formules d'introduction ou de politesse.\n5. Longueur maximale : 20 mots.",
        "prompt": f"Analyse et définis brièvement la tendance '{title}' à l'aide de ces informations web : '{web_context}'\nDéfinition brute (en français) :",
        "stream": False
    }
    
    try:
        response = requests.post(url, json=payload)
        return response.json()['response'].strip()
    except Exception as e:
        print(f"❌ Erreur de connexion à Ollama : {e}")
        print("💡 As-tu bien lancé 'ollama run llama3' dans un autre terminal ?")
        return None

def enrich_trends():
    print("🚀 Démarrage de l'enrichisseur IA (Mode Connecté au Web)...")
    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    engine = create_engine(db_url)

    default_text = "La description de cette tendance n'est pas encore disponible. Notre équipe vous prie de l'en excuser et vous invite à revenir prochainement."

    with engine.connect() as connection:
        trends_to_update = connection.execute(text("SELECT id, title FROM trends WHERE description = :d"), {"d": default_text}).fetchall()
        
        if not trends_to_update:
            print("✨ Aucune tendance en attente d'enrichissement. Tout est à jour !")
            return

        for trend in trends_to_update:
            print(f"🤖 Réflexion sur la tendance : '{trend.title}'...")
            new_desc = get_ai_description(trend.title)
            
            if new_desc:
                connection.execute(
                    text("UPDATE trends SET description = :desc WHERE id = :id"),
                    {"desc": new_desc, "id": trend.id}
                )
                print(f"✅ Description ajoutée : {new_desc}\n")
        
        connection.commit()
        print("🎉 Mission accomplie ! Les tendances ont été enrichies.")

if __name__ == "__main__":
    enrich_trends()