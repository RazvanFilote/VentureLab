from tests.conftest import make_idea, make_feedback


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_feedback(client):
    idea = make_idea(client)
    fb = make_feedback(client, idea["id"])
    assert fb["rating"] == 4
    assert fb["idea_id"] == idea["id"]
    assert "id" in fb


def test_create_feedback_rating_out_of_range(client):
    idea = make_idea(client)
    r = client.post("/api/feedback", json={
        "idea_id": idea["id"],
        "user": "Alice",
        "rating": 6,
        "comment": "Out of range rating here",
    })
    assert r.status_code == 422


def test_create_feedback_rating_zero(client):
    idea = make_idea(client)
    r = client.post("/api/feedback", json={
        "idea_id": idea["id"],
        "user": "Alice",
        "rating": 0,
        "comment": "Zero rating test case",
    })
    assert r.status_code == 422


def test_create_feedback_comment_too_short(client):
    idea = make_idea(client)
    r = client.post("/api/feedback", json={
        "idea_id": idea["id"],
        "user": "Alice",
        "rating": 3,
        "comment": "short",
    })
    assert r.status_code == 422


def test_create_feedback_missing_fields(client):
    r = client.post("/api/feedback", json={"rating": 3})
    assert r.status_code == 422


# ── READ ──────────────────────────────────────────────────────────────────────

def test_list_feedback_empty(client):
    r = client.get("/api/feedback")
    assert r.json()["total"] == 0


def test_list_feedback_filter_by_idea(client):
    idea1 = make_idea(client, title="Idea One")
    idea2 = make_idea(client, title="Idea Two")
    make_feedback(client, idea1["id"])
    make_feedback(client, idea1["id"], rating=5)
    make_feedback(client, idea2["id"])
    r = client.get(f"/api/feedback?idea_id={idea1['id']}")
    assert r.json()["total"] == 2


def test_list_feedback_pagination(client):
    idea = make_idea(client)
    for i in range(8):
        make_feedback(client, idea["id"], rating=(i % 5) + 1)
    r = client.get("/api/feedback?page=2&page_size=3")
    data = r.json()
    assert len(data["items"]) == 3
    assert data["total"] == 8
    assert data["pages"] == 3


def test_get_feedback(client):
    idea = make_idea(client)
    fb = make_feedback(client, idea["id"])
    r = client.get(f"/api/feedback/{fb['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == fb["id"]


def test_get_feedback_not_found(client):
    assert client.get("/api/feedback/ghost").status_code == 404


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_feedback(client):
    idea = make_idea(client)
    fb = make_feedback(client, idea["id"])
    r = client.put(f"/api/feedback/{fb['id']}", json={"rating": 5})
    assert r.status_code == 200
    assert r.json()["rating"] == 5


def test_update_feedback_comment(client):
    idea = make_idea(client)
    fb = make_feedback(client, idea["id"])
    r = client.put(f"/api/feedback/{fb['id']}", json={"comment": "Updated comment with enough length"})
    assert r.json()["comment"] == "Updated comment with enough length"


def test_update_feedback_invalid_rating(client):
    idea = make_idea(client)
    fb = make_feedback(client, idea["id"])
    r = client.put(f"/api/feedback/{fb['id']}", json={"rating": 10})
    assert r.status_code == 422


def test_update_feedback_not_found(client):
    r = client.put("/api/feedback/ghost", json={"rating": 3})
    assert r.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_feedback(client):
    idea = make_idea(client)
    fb = make_feedback(client, idea["id"])
    assert client.delete(f"/api/feedback/{fb['id']}").status_code == 204
    assert client.get(f"/api/feedback/{fb['id']}").status_code == 404


def test_delete_feedback_not_found(client):
    assert client.delete("/api/feedback/ghost").status_code == 404
