import pytest
from datetime import datetime, timedelta
from scraper.main import extract_signals, calculate_trend_status, identify_trend_name, FALLBACK_BAN

# --- Tests existants (corrigés pour ID en string, banned_list et 3 retours) ---

def test_extract_signals_basic():
    posts = [
        {
            "aweme_info": {
                "author": {"unique_id": "user1"},
                "cha_list": [{"hashtag_name": "trend1"}, {"hashtag_name": "trend2"}],
                "music": {"id_str": "101", "title": "Song A", "author": "Artist A"}
            }
        },
        {
            "aweme_info": {
                "author": {"unique_id": "user2"},
                "cha_list": [{"hashtag_name": "trend1"}, {"hashtag_name": "trend3"}],
                "music": {"id_str": "101", "title": "Song A", "author": "Artist A"}
            }
        }
    ]
    keyword = "fashion"
    weak_signals, music, creators = extract_signals(posts, keyword, FALLBACK_BAN)
    
    assert weak_signals["top_tags"][0]["name"] == "trend1"
    assert music[0]["id"] == "101"
    assert creators == 2

def test_extract_signals_co_occurrence():
    # Deux vidéos partageant deux hashtags de niche
    posts = [
        {
            "aweme_info": {
                "author": {"unique_id": "user1"},
                "cha_list": [{"hashtag_name": "niche1"}, {"hashtag_name": "niche2"}]
            }
        },
        {
            "aweme_info": {
                "author": {"unique_id": "user2"},
                "cha_list": [{"hashtag_name": "niche1"}, {"hashtag_name": "niche2"}]
            }
        },
        {
            "aweme_info": {
                "author": {"unique_id": "user3"},
                "cha_list": [{"hashtag_name": "niche1"}]
            }
        }
    ]
    weak_signals, music, creators = extract_signals(posts, "macro", FALLBACK_BAN)
    
    # Doit identifier le cluster [niche1, niche2]
    cluster = weak_signals["clusters"][0]
    assert set(cluster["tags"]) == {"niche1", "niche2"}
    assert cluster["count"] == 2

# --- Nouveaux Tests : Vélocité et Statuts (Seuils Audit) ---

def test_calculate_trend_status_viral():
    status = calculate_trend_status(6000000, 3000000)
    assert status == "VIRAL"

def test_calculate_trend_status_emergent():
    status = calculate_trend_status(500000, 400000)
    assert status == "EMERGENT"

def test_calculate_trend_status_en_baisse():
    status = calculate_trend_status(1000000, 1200000)
    assert status == "EN_BAISSE"

# --- Nouveaux Tests : Naming Pipeline & Slugs ---

def test_identify_trend_name_from_hashtags():
    posts = [
        {"aweme_info": {"cha_list": [{"hashtag_name": "gorp_core"}]}},
        {"aweme_info": {"cha_list": [{"hashtag_name": "gorp_core"}]}}
    ]
    name, slug = identify_trend_name(posts, "tech", FALLBACK_BAN)
    assert name == "Gorp Core"
    assert slug == "tech-gorp-core"
