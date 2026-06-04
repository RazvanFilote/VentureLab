"""Test setup.

The default DATABASE_URL points at SQL Server. For the bulk of the test
suite we override it to SQLite (in-memory equivalent — a file in the cwd)
which is fast, isolated, and works on any machine.

`TESTING=1` short-circuits the lifespan migrations + seed (we use
`Base.metadata.create_all` instead, which is enough for ORM-level tests).
A separate `test_db_procs_triggers.py` module reconnects to SQL Server
when DATABASE_URL is set explicitly.
"""
import os

# These must be set BEFORE importing app modules — `app.db.session` reads
# DATABASE_URL at import time.
os.environ.setdefault("TESTING", "1")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import pytest
from fastapi.testclient import TestClient

from app.db.session import engine, Base, SessionLocal
from app.db import models  # noqa: F401 — register tables on Base.metadata


# Patch the lifespan-invoked helpers so tests don't run real Alembic /
# don't auto-seed. We do create_all once at session start instead.
import app.main as _main  # noqa: E402

_main.run_migrations = lambda: None
_main.seed_all = lambda: None

from app.main import app  # noqa: E402
from app.auth import get_current_user, require_admin  # noqa: E402
from app.db.models import User, UserRoleEnum  # noqa: E402


# Most legacy tests don't care about auth. Override the auth dependencies to
# return a synthetic admin so every protected endpoint passes by default.
# `test_auth.py` clears these overrides for its own end-to-end checks.
def _fake_admin() -> User:
    return User(
        id="test-admin",
        name="Test Admin",
        email="admin@test.local",
        password_hash="x",
        role=UserRoleEnum.Admin,
    )


app.dependency_overrides[get_current_user] = _fake_admin
app.dependency_overrides[require_admin] = _fake_admin


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_stores():
    """Wipe every table between tests. Order matters because of FKs."""
    s = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            s.execute(table.delete())
        s.commit()
    finally:
        s.close()


@pytest.fixture
def client():
    return TestClient(app)


# ── Helpers ──────────────────────────────────────────────────────────────────

def make_idea(client, **overrides):
    payload = {
        "title": "Test Startup",
        "industry": "AI",
        "stage": "MVP",
        "description": "A long enough description for validation",
        "created_by": "Michael Chen",
        **overrides,
    }
    r = client.post("/api/ideas", json=payload)
    assert r.status_code == 201
    return r.json()


def make_user(client, **overrides):
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "secret123",
        "role": "Investor",
        **overrides,
    }
    r = client.post("/api/users", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


def make_offer(client, idea_id, **overrides):
    payload = {
        "idea_id": idea_id,
        "idea_title": "Test Startup",
        "investor_name": "Emily Rodriguez",
        "amount": 50000,
        "equity": 10,
        "message": "Very interested in this idea",
        **overrides,
    }
    r = client.post("/api/offers", json=payload)
    assert r.status_code == 201
    return r.json()


def make_feedback(client, idea_id, **overrides):
    payload = {
        "idea_id": idea_id,
        "user": "Emily Rodriguez",
        "rating": 4,
        "comment": "Great potential for growth",
        **overrides,
    }
    r = client.post("/api/feedback", json=payload)
    assert r.status_code == 201
    return r.json()
