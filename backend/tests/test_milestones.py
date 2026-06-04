from tests.conftest import make_idea


def make_milestone(client, idea_id, **overrides):
    payload = {
        "title": "Launch MVP",
        "description": "Release the minimum viable product",
        "status": "Pending",
        **overrides,
    }
    r = client.post(f"/api/ideas/{idea_id}/milestones", json=payload)
    assert r.status_code == 201
    return r.json()


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_milestone(client):
    idea = make_idea(client)
    m = make_milestone(client, idea["id"])
    assert m["title"] == "Launch MVP"
    assert m["status"] == "Pending"
    assert m["idea_id"] == idea["id"]
    assert "id" in m
    assert "created_at" in m


def test_create_milestone_idea_not_found(client):
    r = client.post("/api/ideas/ghost/milestones", json={"title": "X", "description": "desc"})
    assert r.status_code == 404


def test_create_milestone_title_too_long(client):
    idea = make_idea(client)
    r = client.post(f"/api/ideas/{idea['id']}/milestones", json={"title": "x" * 201, "description": "desc"})
    assert r.status_code == 422


def test_create_milestone_with_due_date(client):
    idea = make_idea(client)
    m = make_milestone(client, idea["id"], due_date="2025-12-31")
    assert m["due_date"] == "2025-12-31"


def test_create_milestone_default_status(client):
    idea = make_idea(client)
    r = client.post(f"/api/ideas/{idea['id']}/milestones", json={"title": "X", "description": "desc"})
    assert r.json()["status"] == "Pending"


# ── READ ──────────────────────────────────────────────────────────────────────

def test_list_milestones_empty(client):
    idea = make_idea(client)
    r = client.get(f"/api/ideas/{idea['id']}/milestones")
    assert r.status_code == 200
    assert r.json() == []


def test_list_milestones(client):
    idea = make_idea(client)
    make_milestone(client, idea["id"], title="M1")
    make_milestone(client, idea["id"], title="M2")
    r = client.get(f"/api/ideas/{idea['id']}/milestones")
    assert len(r.json()) == 2


def test_list_milestones_idea_not_found(client):
    assert client.get("/api/ideas/ghost/milestones").status_code == 404


def test_list_milestones_scoped_to_idea(client):
    idea1 = make_idea(client, title="Idea One")
    idea2 = make_idea(client, title="Idea Two")
    make_milestone(client, idea1["id"], title="M1")
    make_milestone(client, idea1["id"], title="M2")
    make_milestone(client, idea2["id"], title="M3")
    assert len(client.get(f"/api/ideas/{idea1['id']}/milestones").json()) == 2
    assert len(client.get(f"/api/ideas/{idea2['id']}/milestones").json()) == 1


def test_get_milestone(client):
    idea = make_idea(client)
    m = make_milestone(client, idea["id"])
    r = client.get(f"/api/ideas/{idea['id']}/milestones/{m['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == m["id"]


def test_get_milestone_not_found(client):
    idea = make_idea(client)
    assert client.get(f"/api/ideas/{idea['id']}/milestones/ghost").status_code == 404


def test_get_milestone_wrong_idea(client):
    idea1 = make_idea(client, title="Idea One")
    idea2 = make_idea(client, title="Idea Two")
    m = make_milestone(client, idea1["id"])
    assert client.get(f"/api/ideas/{idea2['id']}/milestones/{m['id']}").status_code == 404


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_milestone_status(client):
    idea = make_idea(client)
    m = make_milestone(client, idea["id"])
    r = client.put(f"/api/ideas/{idea['id']}/milestones/{m['id']}", json={"status": "Done"})
    assert r.status_code == 200
    assert r.json()["status"] == "Done"


def test_update_milestone_title(client):
    idea = make_idea(client)
    m = make_milestone(client, idea["id"])
    r = client.put(f"/api/ideas/{idea['id']}/milestones/{m['id']}", json={"title": "New Title"})
    assert r.json()["title"] == "New Title"


def test_update_milestone_not_found(client):
    idea = make_idea(client)
    r = client.put(f"/api/ideas/{idea['id']}/milestones/ghost", json={"status": "Done"})
    assert r.status_code == 404


def test_update_milestone_wrong_idea(client):
    idea1 = make_idea(client, title="Idea One")
    idea2 = make_idea(client, title="Idea Two")
    m = make_milestone(client, idea1["id"])
    r = client.put(f"/api/ideas/{idea2['id']}/milestones/{m['id']}", json={"status": "Done"})
    assert r.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_milestone(client):
    idea = make_idea(client)
    m = make_milestone(client, idea["id"])
    assert client.delete(f"/api/ideas/{idea['id']}/milestones/{m['id']}").status_code == 204
    assert client.get(f"/api/ideas/{idea['id']}/milestones/{m['id']}").status_code == 404


def test_delete_milestone_not_found(client):
    idea = make_idea(client)
    assert client.delete(f"/api/ideas/{idea['id']}/milestones/ghost").status_code == 404


def test_delete_milestone_wrong_idea(client):
    idea1 = make_idea(client, title="Idea One")
    idea2 = make_idea(client, title="Idea Two")
    m = make_milestone(client, idea1["id"])
    assert client.delete(f"/api/ideas/{idea2['id']}/milestones/{m['id']}").status_code == 404


# ── STATS INTEGRATION ─────────────────────────────────────────────────────────

def test_global_stats_includes_milestones(client):
    idea = make_idea(client)
    make_milestone(client, idea["id"], status="Done")
    make_milestone(client, idea["id"], status="Pending")
    r = client.get("/api/stats")
    data = r.json()
    assert data["total_milestones"] == 2
    assert data["done_milestones"] == 1
    assert data["milestone_completion_rate"] == 50.0


def test_idea_stats_includes_milestones(client):
    idea = make_idea(client)
    make_milestone(client, idea["id"], status="Done")
    make_milestone(client, idea["id"], status="Done")
    make_milestone(client, idea["id"], status="Pending")
    r = client.get(f"/api/stats/ideas/{idea['id']}")
    data = r.json()
    assert data["total_milestones"] == 3
    assert data["done_milestones"] == 2
    assert data["milestone_completion_rate"] == pytest.approx(66.7, abs=0.1)


import pytest
