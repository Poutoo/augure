import pytest
from datetime import datetime, timedelta
from scraper.main import extract_signals, calculate_trend_status, identify_trend_name

# --- Tests existants (corrigés pour ID en string) ---

def test_extract_signals_basic():
    posts = [
        {
            "aweme_info": {
                "cha_list": [{"hashtag_name": "trend1"}, {"hashtag_name": "trend2"}],
                "music": {"id_str": "101", "title": "Song A", "author": "Artist A"}
            }
        },
        {
            "aweme_info": {
                "cha_list": [{"hashtag_name": "trend1"}, {"hashtag_name": "trend3"}],
                "music": {"id_str": "101", "title": "Song A", "author": "Artist A"}
            }
        }
    ]
    keyword = "fashion"
    hashtags, music = extract_signals(posts, keyword)
    assert hashtags[0]["name"] == "trend1"
    assert music[0]["id"] == "101"

# --- Nouveaux Tests : Vélocité et Statuts ---

def test_calculate_trend_status_viral():
    # Cas : Post de 2 jours avec 500k vues (250k/jour) -> VIRAL
    original_post_at = datetime.now() - timedelta(days=2)
    status = calculate_trend_status(500000, 0, original_post_at=original_post_at)
    assert status == "VIRAL"

def test_calculate_trend_status_emergent():
    # Cas : Post de 4 jours avec 60k vues (15k/jour) -> EMERGENT
    original_post_at = datetime.now() - timedelta(days=4)
    status = calculate_trend_status(60000, 0, original_post_at=original_post_at)
    assert status == "EMERGENT"

def test_calculate_trend_status_stable_old_post():
    # Cas : Vieux post (20 jours) même avec gros volume -> STABLE
    original_post_at = datetime.now() - timedelta(days=20)
    status = calculate_trend_status(2000000, 0, original_post_at=original_post_at)
    assert status == "STABLE"

def test_calculate_trend_status_en_hausse_snapshot():
    # Cas : Croissance forte par rapport à hier (>30%) -> EN_HAUSSE (prime sur l'âge)
    status = calculate_trend_status(1000000, 700000) 
    assert status == "EN_HAUSSE"

# --- Nouveaux Tests : Naming Pipeline ---

def test_identify_trend_name_from_search_desc():
    posts = [{"aweme_info": {"search_desc": "Cottagecore Aesthetic"}}]
    name = identify_trend_name(posts, "fashion")
    assert name == "Cottagecore Aesthetic"

def test_identify_trend_name_from_hashtags():
    posts = [
        {"aweme_info": {"cha_list": [{"hashtag_name": "gorp_core"}]}},
        {"aweme_info": {"cha_list": [{"hashtag_name": "gorp_core"}]}}
    ]
    name = identify_trend_name(posts, "tech")
    assert name == "Gorp Core"

def test_identify_trend_name_excludes_generic():
    posts = [
        {"aweme_info": {"cha_list": [{"hashtag_name": "fyp"}, {"hashtag_name": "streetwear"}]}}
    ]
    name = identify_trend_name(posts, "fashion")
    assert name == "Streetwear"
