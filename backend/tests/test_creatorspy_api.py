import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_check():
    """Verify system health, API key statuses, and in-memory cache metrics."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "online"
    assert "cache_stats" in data
    assert "channels" in data["cache_stats"]
    assert "dossiers" in data["cache_stats"]

def test_sample_creators_list():
    """Verify benchmark iconic channels are available for instant 0-latency demo."""
    res = client.get("/api/creator/samples")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    handles = [c["handle"] for c in data]
    assert "@mkbhd" in handles or any("mkbhd" in h.lower() for h in handles)

def test_sample_dossier_mkbhd():
    """Verify complete multi-agent dossier deconstruction schema."""
    res = client.get("/api/creator/sample/mkbhd")
    assert res.status_code == 200
    data = res.json()
    assert "channel" in data
    assert "active_dossier" in data
    d = data["active_dossier"]
    assert "hook_forensics" in d
    assert "retention_pacing" in d
    assert "director_script" in d
    assert len(d["director_script"]) >= 3
    assert "thumbnail_strategy" in d
    assert "multi_platform" in d

def test_search_hook_vault():
    """Verify ChromaDB RAG Vector Hook Vault search."""
    res = client.post("/api/creator/search-hook-vault", json={"query": "money", "category": None, "niche": None})
    assert res.status_code == 200
    data = res.json()
    assert data["total"] > 0
    assert len(data["hooks"]) > 0
    assert "hook_text" in data["hooks"][0]
    assert "psychology_breakdown" in data["hooks"][0]

def test_adapt_hook_endpoint():
    """Verify dynamic hook adaptation to user niche and topic."""
    payload = {
        "hook_id": "hook_warikoo_01",
        "user_niche": "Tech & SaaS",
        "user_topic": "Learning Next.js vs AI Tools"
    }
    res = client.post("/api/creator/adapt-hook", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "adapted_hook_line" in data
    assert "visual_pattern_interrupt" in data
    assert "thumbnail_3_word_text" in data
    assert "fast_cut_script" in data
    assert len(data["fast_cut_script"]) >= 3
    assert data["predicted_retention_score"] >= 80

def test_auth_login_and_register():
    """Verify seamless creator authentication."""
    login_res = client.post("/api/auth/login", json={"email": "creator@creatorspy.ai", "password": "password123"})
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["user"]["email"] == "creator@creatorspy.ai"
    assert "token" in data

    reg_res = client.post("/api/auth/register", json={"email": "newuser@creatorspy.ai", "name": "New Creator", "password": "pass"})
    assert reg_res.status_code == 200
    assert reg_res.json()["user"]["name"] == "New Creator"

def test_in_memory_cache_efficiency():
    """Verify in-memory LRU cache serves identical query instantly with cache hit."""
    payload = {
        "hook_id": "hook_mkbhd_01",
        "user_niche": "Productivity",
        "user_topic": "Time Blocking vs To-Do Lists"
    }
    res1 = client.post("/api/creator/adapt-hook", json=payload)
    assert res1.status_code == 200

    # Second call should hit the in-memory cache instantly
    res2 = client.post("/api/creator/adapt-hook", json=payload)
    assert res2.status_code == 200
    assert res1.json()["adapted_hook_line"] == res2.json()["adapted_hook_line"]

    health = client.get("/api/health").json()
    assert health["cache_stats"]["hooks"]["hits"] >= 1
