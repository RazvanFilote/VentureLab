"""End-to-end tests for /api/auth + role enforcement.

These tests intentionally clear the `get_current_user` / `require_admin`
dependency overrides set up in conftest, so requests go through the real
JWT-decoding path.
"""
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt

from app.auth import (
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    verify_password,
)
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, UserRoleEnum


# ── Fixture: real auth client (no override) ──────────────────────────────────


@pytest.fixture
def real_client(client):
    """A TestClient with the auth dependency overrides cleared."""
    backup = dict(app.dependency_overrides)
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(require_admin, None)
    yield client
    app.dependency_overrides = backup


def _seed_user(*, email: str, password: str, role: str = "Investor", name: str = "Seeded"):
    s = SessionLocal()
    try:
        u = User(
            id=f"seed-{email}",
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=UserRoleEnum(role),
        )
        s.add(u)
        s.commit()
        return u.id
    finally:
        s.close()


# ── hash / verify primitives ─────────────────────────────────────────────────


def test_hash_password_is_not_plaintext():
    h = hash_password("hunter2")
    assert h != "hunter2"
    assert h.startswith("$2")  # bcrypt prefix


def test_verify_password_round_trip():
    h = hash_password("hunter2")
    assert verify_password("hunter2", h) is True
    assert verify_password("wrong", h) is False


def test_verify_password_handles_garbage_hash():
    assert verify_password("anything", "not-a-real-hash") is False


# ── register ─────────────────────────────────────────────────────────────────


def test_register_creates_user_and_returns_token(real_client):
    r = real_client.post("/api/auth/register", json={
        "name": "Alice",
        "email": "alice@example.com",
        "password": "secret123",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["expires_in"] > 0
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["role"] == "Investor"  # default
    assert body["access_token"]


def test_register_default_role_is_investor(real_client):
    r = real_client.post("/api/auth/register", json={
        "name": "Bob",
        "email": "bob@example.com",
        "password": "secret123",
    })
    assert r.json()["user"]["role"] == "Investor"


def test_register_can_set_explicit_role(real_client):
    r = real_client.post("/api/auth/register", json={
        "name": "Owen",
        "email": "owen@example.com",
        "password": "secret123",
        "role": "StartupOwner",
    })
    assert r.json()["user"]["role"] == "StartupOwner"


def test_register_rejects_duplicate_email(real_client):
    _seed_user(email="dup@example.com", password="secret123")
    r = real_client.post("/api/auth/register", json={
        "name": "Dup",
        "email": "dup@example.com",
        "password": "different",
    })
    assert r.status_code == 409


def test_register_validates_password_length(real_client):
    r = real_client.post("/api/auth/register", json={
        "name": "Short",
        "email": "short@example.com",
        "password": "12345",  # under 6
    })
    assert r.status_code == 422


def test_register_validates_email_format(real_client):
    r = real_client.post("/api/auth/register", json={
        "name": "Bad",
        "email": "not-an-email",
        "password": "secret123",
    })
    assert r.status_code == 422


# ── login ────────────────────────────────────────────────────────────────────


def test_login_succeeds_with_correct_credentials(real_client):
    _seed_user(email="li@example.com", password="hunter2")
    r = real_client.post("/api/auth/login", json={
        "email": "li@example.com",
        "password": "hunter2",
    })
    assert r.status_code == 200
    assert r.json()["user"]["email"] == "li@example.com"
    assert r.json()["access_token"]


def test_login_is_case_insensitive_for_email(real_client):
    _seed_user(email="case@example.com", password="hunter2")
    r = real_client.post("/api/auth/login", json={
        "email": "CASE@example.com",
        "password": "hunter2",
    })
    assert r.status_code == 200


def test_login_rejects_wrong_password(real_client):
    _seed_user(email="wp@example.com", password="correct")
    r = real_client.post("/api/auth/login", json={
        "email": "wp@example.com",
        "password": "wrong",
    })
    assert r.status_code == 401


def test_login_rejects_unknown_email(real_client):
    r = real_client.post("/api/auth/login", json={
        "email": "ghost@example.com",
        "password": "anything",
    })
    assert r.status_code == 401


# ── /me + token decoding ─────────────────────────────────────────────────────


def test_me_returns_current_user(real_client):
    _seed_user(email="me@example.com", password="hunter2", name="Me Myself")
    login = real_client.post("/api/auth/login", json={
        "email": "me@example.com", "password": "hunter2",
    }).json()
    token = login["access_token"]
    r = real_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"
    assert r.json()["name"] == "Me Myself"


def test_me_rejects_missing_token(real_client):
    r = real_client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_rejects_garbage_token(real_client):
    r = real_client.get("/api/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


def test_me_rejects_expired_token(real_client):
    user_id = _seed_user(email="exp@example.com", password="hunter2")
    expired = jwt.encode(
        {
            "sub": user_id,
            "email": "exp@example.com",
            "role": "Investor",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = real_client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_me_rejects_token_for_deleted_user(real_client):
    token, _ = create_access_token(user_id="never-existed", email="x@x", role="Investor")
    r = real_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


# ── refresh ──────────────────────────────────────────────────────────────────


def test_refresh_returns_new_token_for_authenticated_user(real_client):
    _seed_user(email="rf@example.com", password="hunter2")
    login = real_client.post("/api/auth/login", json={
        "email": "rf@example.com", "password": "hunter2",
    }).json()
    r = real_client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert r.status_code == 200
    assert r.json()["access_token"]


def test_refresh_requires_token(real_client):
    r = real_client.post("/api/auth/refresh")
    assert r.status_code == 401


# ── logout ───────────────────────────────────────────────────────────────────


def test_logout_returns_204_for_authenticated_user(real_client):
    _seed_user(email="lo@example.com", password="hunter2")
    login = real_client.post("/api/auth/login", json={
        "email": "lo@example.com", "password": "hunter2",
    }).json()
    r = real_client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert r.status_code == 204
    assert r.content == b""


def test_logout_requires_token(real_client):
    r = real_client.post("/api/auth/logout")
    assert r.status_code == 401


def test_logout_rejects_expired_token(real_client):
    user_id = _seed_user(email="loexp@example.com", password="hunter2")
    expired = jwt.encode(
        {
            "sub": user_id,
            "email": "loexp@example.com",
            "role": "Investor",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = real_client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {expired}"},
    )
    assert r.status_code == 401


def test_logout_does_not_invalidate_existing_token(real_client):
    # The /logout endpoint is stateless — the contract is "client drops the
    # token." This test pins that contract so nobody accidentally adds a
    # server-side denylist without updating the docs and the SPA.
    _seed_user(email="lostate@example.com", password="hunter2")
    login = real_client.post("/api/auth/login", json={
        "email": "lostate@example.com", "password": "hunter2",
    }).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    real_client.post("/api/auth/logout", headers=headers)
    r = real_client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["email"] == "lostate@example.com"


# ── role enforcement on protected routers ────────────────────────────────────


def test_ideas_endpoint_rejects_unauthenticated_request(real_client):
    r = real_client.get("/api/ideas")
    assert r.status_code == 401


def test_ideas_endpoint_accepts_any_authenticated_role(real_client):
    _seed_user(email="inv@example.com", password="hunter2", role="Investor")
    login = real_client.post("/api/auth/login", json={
        "email": "inv@example.com", "password": "hunter2",
    }).json()
    r = real_client.get(
        "/api/ideas",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert r.status_code == 200


def test_users_endpoint_rejects_non_admin(real_client):
    _seed_user(email="nonadm@example.com", password="hunter2", role="Investor")
    login = real_client.post("/api/auth/login", json={
        "email": "nonadm@example.com", "password": "hunter2",
    }).json()
    r = real_client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert r.status_code == 403


def test_users_endpoint_accepts_admin(real_client):
    _seed_user(email="adm@example.com", password="hunter2", role="Admin")
    login = real_client.post("/api/auth/login", json={
        "email": "adm@example.com", "password": "hunter2",
    }).json()
    r = real_client.get(
        "/api/users",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert r.status_code == 200


def test_admin_create_user_stores_hashed_password(real_client):
    _seed_user(email="adm2@example.com", password="hunter2", role="Admin")
    login = real_client.post("/api/auth/login", json={
        "email": "adm2@example.com", "password": "hunter2",
    }).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    r = real_client.post("/api/users", json={
        "name": "Made", "email": "made@example.com",
        "password": "freshsecret", "role": "Investor",
    }, headers=headers)
    assert r.status_code == 201
    # Confirm we can log in with that password, which proves it was hashed
    # correctly (not stored as plaintext, not double-hashed).
    r = real_client.post("/api/auth/login", json={
        "email": "made@example.com", "password": "freshsecret",
    })
    assert r.status_code == 200


# ── health stays public ──────────────────────────────────────────────────────


def test_health_endpoint_is_public(real_client):
    r = real_client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
