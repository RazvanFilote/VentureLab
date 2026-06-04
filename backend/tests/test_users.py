from tests.conftest import make_user


# ── CREATE ────────────────────────────────────────────────────────────────────

def test_create_user(client):
    user = make_user(client)
    assert user["name"] == "Test User"
    assert user["role"] == "Investor"
    assert "password" not in user


def test_create_user_duplicate_email(client):
    make_user(client)
    r = client.post("/api/users", json={
        "name": "Another",
        "email": "test@example.com",
        "password": "pass123",
        "role": "Investor",
    })
    assert r.status_code == 409


def test_create_user_invalid_email(client):
    r = client.post("/api/users", json={
        "name": "Test",
        "email": "not-an-email",
        "password": "pass123",
        "role": "Investor",
    })
    assert r.status_code == 422


def test_create_user_short_password(client):
    r = client.post("/api/users", json={
        "name": "Test",
        "email": "new@example.com",
        "password": "123",
        "role": "Investor",
    })
    assert r.status_code == 422


def test_create_user_name_too_short(client):
    r = client.post("/api/users", json={
        "name": "A",
        "email": "short@example.com",
        "password": "pass123",
        "role": "Investor",
    })
    assert r.status_code == 422


def test_create_user_invalid_role(client):
    r = client.post("/api/users", json={
        "name": "Test",
        "email": "role@example.com",
        "password": "pass123",
        "role": "SuperAdmin",
    })
    assert r.status_code == 422


# ── READ ──────────────────────────────────────────────────────────────────────

def test_list_users_empty(client):
    r = client.get("/api/users")
    assert r.json()["total"] == 0


def test_list_users_pagination(client):
    for i in range(7):
        make_user(client, email=f"user{i}@example.com")
    r = client.get("/api/users?page=2&page_size=3")
    data = r.json()
    assert len(data["items"]) == 3
    assert data["total"] == 7
    assert data["pages"] == 3


def test_get_user(client):
    user = make_user(client)
    r = client.get(f"/api/users/{user['id']}")
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


def test_get_user_not_found(client):
    assert client.get("/api/users/ghost").status_code == 404


# ── UPDATE ────────────────────────────────────────────────────────────────────

def test_update_user(client):
    user = make_user(client)
    r = client.put(f"/api/users/{user['id']}", json={"name": "New Name"})
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"


def test_update_user_role(client):
    user = make_user(client)
    r = client.put(f"/api/users/{user['id']}", json={"role": "StartupOwner"})
    assert r.json()["role"] == "StartupOwner"


def test_update_user_email_conflict(client):
    u1 = make_user(client, email="first@example.com")
    u2 = make_user(client, email="second@example.com")
    r = client.put(f"/api/users/{u2['id']}", json={"email": "first@example.com"})
    assert r.status_code == 409


def test_update_user_same_email_allowed(client):
    user = make_user(client)
    r = client.put(f"/api/users/{user['id']}", json={"email": "test@example.com"})
    assert r.status_code == 200


def test_update_user_not_found(client):
    r = client.put("/api/users/ghost", json={"name": "Valid Name"})
    assert r.status_code == 404


# ── DELETE ────────────────────────────────────────────────────────────────────

def test_delete_user(client):
    user = make_user(client)
    assert client.delete(f"/api/users/{user['id']}").status_code == 204
    assert client.get(f"/api/users/{user['id']}").status_code == 404


def test_delete_user_not_found(client):
    assert client.delete("/api/users/ghost").status_code == 404
