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

    if web_context == "Aucune information pertinente trouvée." or web_context == "Impossible de faire la recherche web.":
        print(f"   ⚠️  Aucun contexte web trouvé pour '{title}'. On conserve la valeur par défaut.")
        return None

    url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
    model = os.getenv("AI_MODEL", "llama3")

    payload = {
        "model": model,
        "system": "Tu es un expert en culture web, réseaux sociaux (TikTok, YouTube) et divertissement. Ta mission est d'expliquer l'origine ou le concept d'une tendance en te basant STRICTEMENT sur les informations web fournies.\n\nRÈGLES ABSOLUES :\n1. Rédige EXCLUSIVEMENT en français.\n2. Sois factuel en utilisant le contexte fourni.\n3. Ne renvoie QUE la définition brute.\n4. INTERDICTION d'utiliser des formules d'introduction ou de politesse.\n5. Longueur maximale : 20 mots.\n6. SI LE CONTEXTE NE CONTIENT PAS D'INFORMATION PERTINENTE POUR DÉFINIR CETTE TENDANCE, RÉPONDS UNIQUEMENT PAR LE MOT 'INCONNU'.",
        "prompt": f"Analyse et définis brièvement la tendance '{title}' à l'aide de ces informations web : '{web_context}'\nDéfinition brute (en français) :",
        "stream": False
    }

    try:
        response = requests.post(url, json=payload)
        res_text = response.json()['response'].strip()

        if "INCONNU" in res_text.upper():
            print(f"   ⚠️  L'IA n'a pas pu définir '{title}' avec certitude. On conserve la valeur par défaut.")
            return None

        return res_text
    except Exception as e:
        print(f"❌ Erreur de connexion à Ollama : {e}")
        print(f"💡 As-tu bien lancé 'ollama run {model}' dans un autre terminal ?")
        return None

def enrich_trends():
    print("🚀 Démarrage de l'enrichisseur IA (Mode Connecté au Web)...")
    db_url = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
    engine = create_engine(db_url)

    default_text = os.getenv("DEFAULT_DESCRIPTION", "La description de cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement.")

    with engine.connect() as connection:
        trends_to_update = connection.execute(
            text("SELECT id, title FROM trends WHERE description = :d AND is_mock = FALSE"), 
            {"d": default_text}
        ).fetchall()
        
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