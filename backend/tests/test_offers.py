from tests.conftest import make_idea, make_offer


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"])
    assert offer["status"] == "Pending"
    assert offer["equity"] == 10
    assert offer["idea_id"] == idea["id"]


def test_create_offer_equity_exceeds_owner(client):
    idea = make_idea(client)
    make_offer(client, idea["id"], equity=80)
    # Accept that offer so owner has 20%
    offer2 = make_offer(client, idea["id"], equity=10)
    r_accept = client.patch(f"/api/offers/{offer2['id']}/status", json={"status": "Accepted"})
    # Now owner is at 90% still (offer2 was 10%), we need to accept first offer too
    # Let's just test directly: owner at 100%, requesting 101 fails
    r = client.post("/api/offers", json={
        "idea_id": idea["id"],
        "idea_title": "X",
        "investor_name": "Alice",
        "amount": 1000,
        "equity": 101,
        "message": "This should fail validation",
    })
    assert r.status_code == 422


def test_create_offer_equity_exceeds_available_after_accepted(client):
    idea = make_idea(client)
    o = make_offer(client, idea["id"], equity=80)
    client.patch(f"/api/offers/{o['id']}/status", json={"status": "Accepted"})
    # Owner now has 20% — requesting 30% should fail
    r = client.post("/api/offers", json={
        "idea_id": idea["id"],
        "idea_title": "X",
        "investor_name": "Bob",
        "amount": 5000,
        "equity": 30,
        "message": "Should be rejected by business logic",
    })
    assert r.status_code == 422


def test_create_offer_missing_fields(client):
    r = client.post("/api/offers", json={"idea_id": "x"})
    assert r.status_code == 422


def test_create_offer_negative_amount(client):
    idea = make_idea(client)
    r = client.post("/api/offers", json={
        "idea_id": idea["id"],
        "idea_title": "X",
        "investor_name": "Alice",
        "amount": -500,
        "equity": 10,
        "message": "Negative amount test",
    })
    assert r.status_code == 422


def test_create_offer_zero_equity(client):
    idea = make_idea(client)
    r = client.post("/api/offers", json={
        "idea_id": idea["id"],
        "idea_title": "X",
        "investor_name": "Alice",
        "amount": 1000,
        "equity": 0,
        "message": "Zero equity test",
    })
    assert r.status_code == 422


# ── READ ──────────────────────────────────────────────────────────────────────

def test_list_offers_empty(client):
    r = client.get("/api/offers")
    assert r.json()["total"] == 0


def test_list_offers_filter_by_status(client):
    idea = make_idea(client)
    o1 = make_offer(client, idea["id"], equity=10)
    o2 = make_offer(client, idea["id"], equity=5)
    client.patch(f"/api/offers/{o1['id']}/status", json={"status": "Accepted"})
    r = client.get("/api/offers?status=Accepted")
    assert r.json()["total"] == 1
    r2 = client.get("/api/offers?status=Pending")
    assert r2.json()["total"] == 1


def test_list_offers_pagination(client):
    idea = make_idea(client)
    for i in range(6):
        make_offer(client, idea["id"], equity=i + 1)
    r = client.get("/api/offers?page=1&page_size=4")
    data = r.json()
    assert len(data["items"]) == 4
    assert data["total"] == 6
    assert data["pages"] == 2


def test_get_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"])
    r = client.get(f"/api/offers/{offer['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == offer["id"]


def test_get_offer_not_found(client):
    assert client.get("/api/offers/nope").status_code == 404


# ── STATUS UPDATE ─────────────────────────────────────────────────────────────

def test_accept_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"], equity=20)
    r = client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Accepted"})
    assert r.status_code == 200
    assert r.json()["status"] == "Accepted"


def test_reject_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"])
    r = client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Rejected"})
    assert r.status_code == 200
    assert r.json()["status"] == "Rejected"


def test_cannot_set_status_to_pending(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"])
    r = client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Pending"})
    assert r.status_code == 422


def test_cannot_update_already_accepted_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"], equity=10)
    client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Accepted"})
    r = client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Rejected"})
    assert r.status_code == 409


def test_accept_blocked_below_10_percent(client):
    idea = make_idea(client)
    o1 = make_offer(client, idea["id"], equity=85)
    client.patch(f"/api/offers/{o1['id']}/status", json={"status": "Accepted"})
    # Owner now at 15%
    o2 = make_offer(client, idea["id"], equity=10)
    # Accepting would bring owner to 5% — blocked
    r = client.patch(f"/api/offers/{o2['id']}/status", json={"status": "Accepted"})
    assert r.status_code == 422


def test_status_update_not_found(client):
    r = client.patch("/api/offers/ghost/status", json={"status": "Accepted"})
    assert r.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_pending_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"])
    r = client.delete(f"/api/offers/{offer['id']}")
    assert r.status_code == 204


def test_cannot_delete_accepted_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"], equity=10)
    client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Accepted"})
    r = client.delete(f"/api/offers/{offer['id']}")
    assert r.status_code == 409


def test_delete_rejected_offer(client):
    idea = make_idea(client)
    offer = make_offer(client, idea["id"])
    client.patch(f"/api/offers/{offer['id']}/status", json={"status": "Rejected"})
    r = client.delete(f"/api/offers/{offer['id']}")
    assert r.status_code == 204


def test_delete_offer_not_found(client):
    assert client.delete("/api/offers/ghost").status_code == 404
