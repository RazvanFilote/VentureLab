from tests.conftest import make_idea, make_offer, make_feedback


def test_global_stats_empty(client):
    r = client.get("/api/stats")
    assert r.status_code == 200
    data = r.json()
    assert data["total_ideas"] == 0
    assert data["total_offers"] == 0
    assert data["avg_rating"] == 0.0


def test_global_stats_with_data(client):
    idea = make_idea(client)
    o1 = make_offer(client, idea["id"], equity=10)
    o2 = make_offer(client, idea["id"], equity=5)
    client.patch(f"/api/offers/{o1['id']}/status", json={"status": "Accepted"})
    client.patch(f"/api/offers/{o2['id']}/status", json={"status": "Rejected"})
    make_feedback(client, idea["id"], rating=4)
    make_feedback(client, idea["id"], rating=2)

    r = client.get("/api/stats")
    data = r.json()
    assert data["total_ideas"] == 1
    assert data["total_offers"] == 2
    assert data["accepted_offers"] == 1
    assert data["rejected_offers"] == 1
    assert data["pending_offers"] == 0
    assert data["total_feedback"] == 2
    assert data["avg_rating"] == 3.0


def test_idea_stats(client):
    idea = make_idea(client)
    o1 = make_offer(client, idea["id"], equity=20)
    client.patch(f"/api/offers/{o1['id']}/status", json={"status": "Accepted"})
    make_offer(client, idea["id"], equity=10)
    make_feedback(client, idea["id"], rating=5)
    make_feedback(client, idea["id"], rating=3)

    r = client.get(f"/api/stats/ideas/{idea['id']}")
    assert r.status_code == 200
    data = r.json()
    assert data["owner_percent"] == 80.0
    assert data["accepted_offers"] == 1
    assert data["pending_offers"] == 1
    assert data["avg_rating"] == 4.0
    assert len(data["shareholders"]) == 2
    assert data["shareholders"][0]["is_owner"] is True
    assert data["shareholders"][0]["percent"] == 80.0


def test_idea_stats_top_pending(client):
    idea = make_idea(client)
    make_offer(client, idea["id"], equity=5, amount=10_000)
    make_offer(client, idea["id"], equity=3, amount=50_000)
    make_offer(client, idea["id"], equity=2, amount=25_000)

    r = client.get(f"/api/stats/ideas/{idea['id']}")
    top = r.json()["top_pending_offers"]
    assert top[0]["amount"] == 50_000
    assert top[1]["amount"] == 25_000


def test_idea_stats_not_found(client):
    r = client.get("/api/stats/ideas/nonexistent")
    assert r.status_code == 404


def test_health(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
