from tests.conftest import make_idea


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_idea(client):
    idea = make_idea(client)
    assert idea["title"] == "Test Startup"
    assert idea["industry"] == "AI"
    assert idea["stage"] == "MVP"
    assert "id" in idea
    assert "created_at" in idea


def test_create_idea_missing_field(client):
    r = client.post("/api/ideas", json={"title": "No industry"})
    assert r.status_code == 422


def test_create_idea_title_too_short(client):
    r = client.post("/api/ideas", json={
        "title": "",
        "industry": "AI",
        "stage": "MVP",
        "description": "A long enough description here",
        "created_by": "Owner",
    })
    assert r.status_code == 422


def test_create_idea_description_too_short(client):
    r = client.post("/api/ideas", json={
        "title": "Valid Title",
        "industry": "AI",
        "stage": "MVP",
        "description": "short",
        "created_by": "Owner",
    })
    assert r.status_code == 422


def test_create_idea_invalid_industry(client):
    r = client.post("/api/ideas", json={
        "title": "Valid",
        "industry": "Crypto",
        "stage": "MVP",
        "description": "A long enough description here",
        "created_by": "Owner",
    })
    assert r.status_code == 422


def test_create_idea_invalid_stage(client):
    r = client.post("/api/ideas", json={
        "title": "Valid",
        "industry": "AI",
        "stage": "Beta",
        "description": "A long enough description here",
        "created_by": "Owner",
    })
    assert r.status_code == 422


# ── READ ──────────────────────────────────────────────────────────────────────

def test_list_ideas_empty(client):
    r = client.get("/api/ideas")
    assert r.status_code == 200
    data = r.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["pages"] == 1


def test_list_ideas_with_data(client):
    make_idea(client, title="Idea A")
    make_idea(client, title="Idea B")
    r = client.get("/api/ideas")
    assert r.json()["total"] == 2


def test_list_ideas_pagination(client):
    for i in range(5):
        make_idea(client, title=f"Idea {i}")
    r = client.get("/api/ideas?page=1&page_size=2")
    data = r.json()
    assert len(data["items"]) == 2
    assert data["total"] == 5
    assert data["pages"] == 3

    r2 = client.get("/api/ideas?page=3&page_size=2")
    assert len(r2.json()["items"]) == 1


def test_get_idea(client):
    idea = make_idea(client)
    r = client.get(f"/api/ideas/{idea['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == idea["id"]


def test_get_idea_not_found(client):
    r = client.get("/api/ideas/nonexistent")
    assert r.status_code == 404


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_idea(client):
    idea = make_idea(client)
    r = client.put(f"/api/ideas/{idea['id']}", json={"title": "Updated Title"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


def test_update_idea_partial(client):
    idea = make_idea(client)
    r = client.put(f"/api/ideas/{idea['id']}", json={"stage": "Growth"})
    assert r.status_code == 200
    assert r.json()["stage"] == "Growth"
    assert r.json()["title"] == idea["title"]


def test_update_idea_not_found(client):
    r = client.put("/api/ideas/nope", json={"title": "X"})
    assert r.status_code == 404


def test_update_idea_invalid_stage(client):
    idea = make_idea(client)
    r = client.put(f"/api/ideas/{idea['id']}", json={"stage": "InvalidStage"})
    assert r.status_code == 422


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_idea(client):
    idea = make_idea(client)
    r = client.delete(f"/api/ideas/{idea['id']}")
    assert r.status_code == 204
    assert client.get(f"/api/ideas/{idea['id']}").status_code == 404


def test_delete_idea_not_found(client):
    r = client.delete("/api/ideas/ghost")
    assert r.status_code == 404
