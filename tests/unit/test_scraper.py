import pytest
from scraper.main import extract_signals

def test_extract_signals_basic():
    # Arrange
    posts = [
        {
            "aweme_info": {
                "cha_list": [{"hashtag_name": "trend1"}, {"hashtag_name": "trend2"}],
                "music": {"id": 101, "title": "Song A", "author": "Artist A"}
            }
        },
        {
            "aweme_info": {
                "cha_list": [{"hashtag_name": "trend1"}, {"hashtag_name": "trend3"}],
                "music": {"id": 101, "title": "Song A", "author": "Artist A"}
            }
        },
        {
            "aweme_info": {
                "desc": "Check this out #trend1 #trend4",
                "music": {"id": 102, "title": "Song B", "author": "Artist B"}
            }
        }
    ]
    keyword = "fashion"
    
    # Act
    hashtags, music = extract_signals(posts, keyword)
    
    # Assert
    # trend1 appears 3 times
    assert hashtags[0]["name"] == "trend1"
    assert hashtags[0]["count"] == 3
    
    # music 101 appears 2 times
    assert music[0]["id"] == "101"
    assert music[0]["count"] == 2

def test_extract_signals_excludes_keyword():
    posts = [
        {
            "aweme_info": {
                "cha_list": [{"hashtag_name": "fashion"}, {"hashtag_name": "vogue"}]
            }
        }
    ]
    keyword = "fashion"
    
    hashtags, music = extract_signals(posts, keyword)
    
    assert all(h["name"] != "fashion" for h in hashtags)
    assert hashtags[0]["name"] == "vogue"
