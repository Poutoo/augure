import os
import json
import requests
import uuid
import schedule
import time
import re
import argparse
from datetime import datetime
from rapidfuzz import fuzz, process
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Chargement de la configuration
load_dotenv()
API_KEY = os.getenv("ENSEMBLEDATA_API_KEY")
DB_URL = os.getenv("DATABASE_URL").replace("postgres://", "postgresql://", 1)
SKIP_AUTO_RUN = os.getenv("SKIP_AUTO_RUN", "false").lower() == "true"

# Mapping pour les catégories de l'application
CATEGORY_MAPPING = {
    "Mode": "fashion",
    "Food": "food",
    "Musique": "music",
    "Art": "art",
    "Beauté": "beauty",
    "Tech": "tech"
}

# Liste de secours si la DB est inaccessible
FALLBACK_BAN = {
    "fyp", "foryou", "foryoupage", "viral", "trending",
    "xyzbca", "xyz", "pourtoi", "pov", "grwm", "ootd",
    "foryourpage", "blowthisup", "makeitgofyp", "trend", "explore", "video"
}

def get_banned_hashtags(connection):
    """Charge la liste des hashtags bannis depuis la base de données."""
    try:
        query = text("SELECT tag FROM banned_hashtags")
        result = connection.execute(query).fetchall()
        if not result:
            return FALLBACK_BAN
        return {row[0].lower() for row in result}
    except Exception as e:
        print(f"⚠️ Impossible de charger les hashtags bannis : {e}")
        return FALLBACK_BAN

def is_valid_trend_hashtag(tag, view_count, banned_list):
    """
    Vérifie si un hashtag est pertinent pour une tendance émergente.
    Traitement : Amélioration B (Filtrage dynamique par volume).
    """
    tag = tag.lower().strip().replace("#", "")
    
    # 1. Vérification liste noire
    if tag in banned_list:
        return False
    
    # 2. Filtrage par volume : > 500M = macro-tendance (trop mainstream)
    if view_count > 500000000:
        return False
        
    # 3. Filtrage par longueur
    if len(tag) < 3:
        return False
        
    return True

def get_api_stats():
    """Affiche les crédits utilisés et totaux au démarrage."""
    url = "https://ensembledata.com/apis/customer/get-usage"
    try:
        response = requests.get(url, params={"token": API_KEY}, timeout=10)
        data = response.json().get("data", {})
        print(f"📊 [CRÉDITS] Utilisés : {data.get('used_units', 'N/A')} | Total : {data.get('total_units', 'N/A')}", flush=True)
    except Exception as e:
        print(f"⚠️ Impossible de récupérer les stats : {e}")

def get_api_usage():
    """Récupère le nombre d'unités restantes."""
    url = "https://ensembledata.com/apis/customer/get-usage"
    try:
        response = requests.get(url, params={"token": API_KEY}, timeout=10)
        data = response.json().get("data", {})
        used = data.get('used_units', 0)
        total = data.get('total_units', 0)
        return total - used
    except Exception:
        return 0

def clean_trend_title(raw_title, search_keyword, banned_list):
    """Nettoie le titre en supprimant les hashtags parasites et le bruit."""
    if not raw_title:
        return search_keyword.title()
    
    # Remplacement des underscores/tirets par des espaces
    raw_title = raw_title.replace('_', ' ').replace('-', ' ')
    # Suppression des hashtags (#tag) et conversion en mots
    words = re.sub(r'#\w+', '', raw_title).lower().split()
    # Filtrage via la liste dynamique
    filtered = [w for w in words if w not in banned_list and len(w) > 1]
    cleaned = " ".join(filtered).strip()
    
    # Si le résultat est trop court ou vide, on fallback sur le mot-clé
    if len(cleaned) < 5:
        return search_keyword.title()
    
    return cleaned.title()

def extract_signals(posts, keyword, banned_list):
    """
    Extrait les hashtags, musiques et détecte les co-occurrences.
    Amélioration C : Co-occurrence de hashtags de niche.
    """
    hashtags_freq = {}
    music_freq = {}
    co_occurrences = {}
    unique_authors = set()

    for post in posts:
        aweme_info = post.get('aweme_info', {})
        author_id = aweme_info.get('author', {}).get('unique_id')
        if author_id:
            unique_authors.add(author_id)
            
        # 1. Extraction et filtrage des hashtags de la vidéo
        cha_list = aweme_info.get('cha_list', []) or []
        current_video_tags = set()
        
        for cha in cha_list:
            name = cha.get('hashtag_name', '').lower()
            if name and name != keyword.lower() and is_valid_trend_hashtag(name, 0, banned_list):
                hashtags_freq[name] = hashtags_freq.get(name, 0) + 1
                current_video_tags.add(name)
        
        if not cha_list:
            desc = aweme_info.get('desc', '')
            found_hashtags = re.findall(r'#(\w+)', desc)
            for h in found_hashtags:
                h_low = h.lower()
                if h_low != keyword.lower() and is_valid_trend_hashtag(h_low, 0, banned_list):
                    hashtags_freq[h_low] = hashtags_freq.get(h_low, 0) + 1
                    current_video_tags.add(h_low)

        # 2. Détection de co-occurrence (paires de hashtags)
        tags_list = sorted(list(current_video_tags))
        for i in range(len(tags_list)):
            for j in range(i + 1, len(tags_list)):
                pair = tuple(sorted([tags_list[i], tags_list[j]]))
                co_occurrences[pair] = co_occurrences.get(pair, 0) + 1

        # 3. Musique
        music = aweme_info.get('music', {})
        if music:
            music_id = music.get('id_str') or str(music.get('id', ''))
            if music_id:
                if music_id not in music_freq:
                    music_freq[music_id] = {
                        "id": music_id,
                        "title": music.get('title', 'Unknown'),
                        "author": music.get('author', 'Unknown'),
                        "count": 0
                    }
                music_freq[music_id]["count"] += 1

    # Tri et sélection
    top_hashtags = sorted(hashtags_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Identification des clusters (paires apparaissant sur > 1 vidéo)
    clusters = [
        {"tags": list(pair), "count": count} 
        for pair, count in co_occurrences.items() if count > 1
    ]
    
    weak_signals_hashtags = {
        "top_tags": [{"name": name, "count": count} for name, count in top_hashtags],
        "clusters": sorted(clusters, key=lambda x: x["count"], reverse=True)[:3],
        "unique_creators_count": len(unique_authors)
    }

    top_music = sorted(music_freq.values(), key=lambda x: x["count"], reverse=True)[:3]
    
    return weak_signals_hashtags, top_music, len(unique_authors)

def calculate_trend_status(current_views, delta, previous_views, original_post_at=None, low_confidence=False):
    """
    Calcule le statut basé sur le volume et le momentum (growth rate).
    Intègre la règle de Résurrection et le statut EN_BAISSE.
    """
    if low_confidence:
        return "EMERGENT"

    growth_rate = (delta / previous_views * 100) if previous_views > 0 else 0
    now = datetime.now()

    # 1. Règle de Résurrection : si croissance > 30% sur une tendance de plus de 30 jours
    if original_post_at:
        # Conversion si timestamp
        post_date = original_post_at if isinstance(original_post_at, datetime) else datetime.fromtimestamp(original_post_at)
        delta_time = now - post_date.replace(tzinfo=None)
        if delta_time.days > 30 and growth_rate > 30:
            return "EN_HAUSSE"

    # 2. Cas EN_BAISSE général (perte de momentum ou vues)
    if growth_rate < -10:
        return "EN_BAISSE"

    # 3. Matrice de volume
    if current_views < 1000000:
        return "EMERGENT" if delta > 0 else "EN_BAISSE"
    elif current_views < 5000000:
        if growth_rate > 20:
            return "EN_HAUSSE"
        elif growth_rate < -10:
            return "EN_BAISSE"
        else:
            return "STABLE"
    else:  # >= 5M
        if growth_rate > 50:
            return "VIRAL"
        elif growth_rate < -10:
            return "EN_BAISSE"
        else:
            return "STABLE"

def fetch_audience_demographics(username, dry_run=False):
    """Appelle l'API EnsembleData pour obtenir la distribution par âge (Coût: 26 unités)."""
    if dry_run:
        return {"13-17": 0, "18-24": 0.45, "25-34": 0.35, "35-44": 0.15, "45-65": 0.05, "65-plus": 0}

    print(f"📊 [AUDIENCE] Analyse démographique pour @{username}...")
    url = "https://ensembledata.com/apis/tt/user/audience-demographics"
    try:
        response = requests.get(url, params={"username": username, "token": API_KEY}, timeout=20)
        response.raise_for_status()
        data = response.json().get("data", {})
        raw_age = data.get("age_distribution", {})
        distribution = {
            "13-17": 0,
            "18-24": raw_age.get("18-24", 0),
            "25-34": raw_age.get("25-34", 0),
            "35-44": raw_age.get("35-44", 0),
            "45-65": raw_age.get("45-54", 0) + raw_age.get("55+", 0),
            "65-plus": 0
        }
        return distribution
    except Exception as e:
        print(f"⚠️ Échec de la récupération d'audience : {e}")
        return None

def identify_trend_name(posts, category_keyword, banned_list, connection=None):
    """
    Identifie le nom de la tendance et fournit un slug stable basé sur le mot-clé de recherche.
    Pipeline de nommage hiérarchique : search_desc > hashtag dominant > category_keyword.
    Note : Le titre est recalculé à chaque run pour permettre son amélioration au fil du temps.
    """
    # 1. Extraction du hashtag dominant (non-générique)
    hashtag_counts = {}
    for post in posts:
        cha_list = post.get('aweme_info', {}).get('cha_list', []) or []
        for cha in cha_list:
            name = cha.get('hashtag_name', '').lower()
            if name and is_valid_trend_hashtag(name, 0, banned_list):
                hashtag_counts[name] = hashtag_counts.get(name, 0) + 1
    
    top_tag = None
    if hashtag_counts:
        top_tag = sorted(hashtag_counts.items(), key=lambda x: x[1], reverse=True)[0][0]

    # 2. Détermination du Titre (Pipeline Cascade strict)
    raw_name = ""
    top_post = posts[0].get('aweme_info', {})
    search_desc = top_post.get('search_desc', '').strip()
    
    if search_desc and len(search_desc) > 2:
        raw_name = search_desc
    elif top_tag:
        raw_name = top_tag
    else:
        raw_name = category_keyword

    # Nettoyage final : interdiction d'utiliser 'desc' brute
    clean_name = clean_trend_title(raw_name, category_keyword, banned_list)

    # 3. Slug Stable (Basé sur le mot-clé de recherche pour garantir le suivi du delta)
    stable_slug = category_keyword.lower().replace('_', '-').replace(' ', '-')
    
    # Seul le slug est retourné stable, le titre (clean_name) sera mis à jour en DB via ON CONFLICT
    return clean_name, stable_slug

def insert_to_db(connection, title, slug, total_views, platform_name, category, hashtags, music, description=None, context=None, age_dist=None, original_post_at=None, dry_run=False):
    """Insère ou met à jour la tendance avec un slug persistant et suivi du delta."""
    previous_views = 0
    existing = None
    delta = 0
    low_confidence = False

    if not dry_run:
        # 1. LIRE l'ancienne valeur AVANT toute écriture
        prev_query = text("SELECT score_base, status FROM trends WHERE slug = :slug")
        existing = connection.execute(prev_query, {"slug": slug}).fetchone()
        
        if existing:
            previous_views = existing.score_base
            delta = total_views - previous_views
            low_confidence = False
            
            # 2. SAUVEGARDER le snapshot de l'ancienne valeur si elle a changé
            if total_views != previous_views:
                snapshot_query = text("""
                    INSERT INTO trends_snapshots (id, trend_slug, views_count, recorded_at)
                    VALUES (:id, :slug, :views, NOW())
                """)
                connection.execute(snapshot_query, {"id": str(uuid.uuid4()), "slug": slug, "views": previous_views})
        else:
            # Premier run d'une tendance
            previous_views = 0
            delta = 0
            low_confidence = True
    else:
        previous_views = 500000 
        delta = total_views - previous_views
        low_confidence = False

    # 3. Calcul du statut avec le delta réel, le flag de confiance et l'original_post_at (VERIF 3 & 4)
    new_status = calculate_trend_status(total_views, delta, previous_views, original_post_at=original_post_at, low_confidence=low_confidence).upper()

    if dry_run:
        print(f"🧪 [DRY-RUN] Serait inséré : {title} | Slug: {slug} | Status: {new_status} | Vues: {total_views} (Delta: {delta})")
        return

    # 4. Écriture finale
    extra_stats = {"low_confidence": low_confidence, "last_delta": delta}
    
    query = text("""
        INSERT INTO trends (
            id, title, slug, description, context, usage_example, 
            score_base, platforms, status, category, 
            weak_signals_hashtags, weak_signals_music, age_distribution, 
            extra_stats, original_post_at, created_at
        )
        VALUES (
            :id, :title, :slug, :description, :context, :usage_example, 
            :score, :platforms, :status, :category, 
            :hashtags, :music, :age_dist, 
            :extra_stats, :original_post_at, NOW()
        )
        ON CONFLICT (slug) DO UPDATE 
        SET title = EXCLUDED.title,
            score_base = EXCLUDED.score_base,
            status = EXCLUDED.status,
            description = EXCLUDED.description,
            weak_signals_hashtags = EXCLUDED.weak_signals_hashtags,
            weak_signals_music = EXCLUDED.weak_signals_music,
            extra_stats = EXCLUDED.extra_stats,
            age_distribution = COALESCE(EXCLUDED.age_distribution, trends.age_distribution),
            original_post_at = COALESCE(EXCLUDED.original_post_at, trends.original_post_at);
    """)
    
    connection.execute(query, {
        "id": str(uuid.uuid4()), 
        "title": title, 
        "slug": slug,
        "description": description or os.getenv("DEFAULT_DESCRIPTION", "La description de cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement."),
        "context": context or os.getenv("DEFAULT_CONTEXT", "Le contexte de cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement."),
        "usage_example": os.getenv("DEFAULT_USAGE", "L'exemple d'usage pour cette tendance n'est pas encore disponible. Nous vous prions de nous excuser pour ce désagrément et vous invitons à réessayer ultérieurement."),
        "score": total_views, 
        "platforms": json.dumps([platform_name]),
        "status": new_status,
        "category": category,
        "hashtags": json.dumps(hashtags),
        "music": json.dumps(music),
        "age_dist": json.dumps(age_dist) if age_dist else None,
        "extra_stats": json.dumps(extra_stats),
        "original_post_at": original_post_at
    })
    connection.commit()
    print(f"✅ [{platform_name.upper()}] '{title}' ({new_status}) synchronisé. Vues: {total_views} ({'+' if delta >= 0 else ''}{delta})")

def scrape_tiktok(category, dry_run=False):
    """Récupère et analyse les signaux faibles TikTok pour une catégorie donnée."""
    if not API_KEY and not dry_run:
        print("❌ ERREUR: API_KEY manquante.")
        return

    keyword = CATEGORY_MAPPING.get(category, category.lower())
    print(f"📱 [{datetime.now().strftime('%H:%M:%S')}] {'[DRY-RUN] ' if dry_run else ''}Analyse TikTok pour '{category}' (Mot-clé: {keyword})...", flush=True)
    
    try:
        engine = create_engine(DB_URL)
        banned_list = FALLBACK_BAN
        
        with engine.connect() as conn:
            if not dry_run:
                banned_list = get_banned_hashtags(conn)

            if dry_run:
                import random
                mock_views = {
                    "fashion": random.randint(1000000, 2000000),
                    "food": random.randint(800000, 1500000),
                    "music": random.randint(5000000, 10000000),
                    "art": random.randint(100000, 500000),
                    "beauty": random.randint(2000000, 4000000),
                    "tech": random.randint(300000, 800000)
                }
                current_mock_views = mock_views.get(keyword, 1250000)
                raw_json = {
                    "data": [
                        {
                            "aweme_info": {
                                "desc": f"Ceci est une simulation de tendance pour {category} #test #viral",
                                "statistics": {"play_count": current_mock_views},
                                "author": {"unique_id": "user_test"},
                                "music": {"id_str": "123", "title": "Mock Music", "author": "Mock Artist"},
                                "cha_list": [{"hashtag_name": "test"}, {"hashtag_name": "viral"}]
                            }
                        }
                    ]
                }
            else:
                url = "https://ensembledata.com/apis/tt/keyword/search"
                params = {"name": keyword, "period": "7", "sorting": "1", "token": API_KEY}
                response = requests.get(url, params=params, timeout=20)
                response.raise_for_status()
                raw_json = response.json()

            posts = raw_json.get("data", [])
            if isinstance(posts, dict): posts = posts.get("data", [])
                
            if posts:
                sample_posts = posts[:20]
                weak_signals_hashtags, music, unique_creators_count = extract_signals(sample_posts, keyword, banned_list)
                
                if unique_creators_count < 5 and not dry_run:
                    print(f"⚠️ Tendance '{keyword}' ignorée : seulement {unique_creators_count} créateurs uniques (seuil: 5).")
                    return

                top_post = sample_posts[0]
                aweme_info = top_post.get('aweme_info', {})
                author = aweme_info.get('author', {})
                username = author.get('unique_id')
                
                statistics = aweme_info.get('statistics', {})
                raw_views = statistics.get('play_count', 0)
                
                # Passer la connexion pour le dédoublonnage fuzzy
                title, slug = identify_trend_name(sample_posts, keyword, banned_list, connection=conn if not dry_run else None)
                
                description = aweme_info.get('desc')
                create_time = aweme_info.get('create_time')
                original_post_at = datetime.fromtimestamp(create_time) if create_time else None
                
                age_dist = None
                if dry_run:
                    age_dist = fetch_audience_demographics(username, dry_run=True)
                else:
                    remaining_credits = get_api_usage()
                    # RÈGLE 1 : Ne pas appeler l'audience (26 crédits) si budget < 30
                    if remaining_credits >= 30 and username:
                        age_dist = fetch_audience_demographics(username)
                    elif username:
                        print(f"📉 [QUOTA] Audience ignorée pour @{username} (Crédits restants : {remaining_credits})")
                
                if dry_run:
                    insert_to_db(None, title, slug, int(raw_views), "tiktok", category, weak_signals_hashtags, music, description=description, age_dist=age_dist, original_post_at=original_post_at, dry_run=True)
                else:
                    insert_to_db(conn, title, slug, int(raw_views), "tiktok", category, weak_signals_hashtags, music, description=description, age_dist=age_dist, original_post_at=original_post_at)
            else:
                print(f"⚠️ Aucune donnée pour '{category}'.")
    except Exception as e:
        print(f"❌ Erreur sur '{category}' : {e}")

def run_all_categories(dry_run=False):
    """Parcourt toutes les catégories."""
    for category in CATEGORY_MAPPING.keys():
        scrape_tiktok(category, dry_run=dry_run)
        if not dry_run: time.sleep(2)

def main():
    parser = argparse.ArgumentParser(description="Orchestrateur Augure Scraper")
    parser.add_argument("--dry-run", action="store_true", help="Simule l'exécution sans consommer de crédits API")
    args = parser.parse_args()

    print(f"🚀 Orchestrateur Augure prêt. {'[MODE DRY-RUN]' if args.dry_run else ''}")
    if not args.dry_run:
        get_api_stats()
        
        # PROTECTION : On ne lance le run immédiat que s'il reste assez de crédits (>35)
        # pour ne pas bloquer le run programmé de 04:00 en cas de redémarrage container.
        credits = get_api_usage()
        if credits >= 35:
            run_all_categories()
        else:
            print(f"⏳ [QUOTA] Run de démarrage sauté (Budget : {credits}/50). Attente du prochain créneau (04:00).")
            
        schedule.every().day.at("04:00").do(run_all_categories)
        while True:
            schedule.run_pending()
            time.sleep(60)
    else:
        run_all_categories(dry_run=True)
        print("🧪 Dry-run terminé avec succès.")

if __name__ == "__main__":
    main()
