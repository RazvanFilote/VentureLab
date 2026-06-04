"""Tests that exercise the SQL Server stored procedures and triggers.

These run only when DATABASE_URL points at SQL Server (so they're skipped
in the default SQLite test environment). Run them with:

    set DATABASE_URL=mssql+pyodbc://@localhost\\SQLEXPRESS/venturelab_test?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
    pytest tests/test_db_procs_triggers.py -v

The fixture creates a fresh schema, applies all migrations (including
0002_procs_triggers), runs the test, then drops everything.
"""
import os
import uuid
from datetime import date

import pytest
from sqlalchemy import text

from app.db.session import engine, Base, SessionLocal, DATABASE_URL
from app.db import models  # noqa: F401


pytestmark = pytest.mark.skipif(
    not DATABASE_URL.startswith("mssql"),
    reason="Requires SQL Server; set DATABASE_URL=mssql+pyodbc://...",
)


@pytest.fixture(scope="module", autouse=True)
def _apply_migrations():
    """Drop and recreate everything (incl. procs and triggers) for the module."""
    from app.db.init_db import run_migrations

    # Cleanest: drop tables (cascades drop FK-bound objects), drop procs/triggers
    with engine.begin() as conn:
        for trg in (
            "trg_offers_block_accepted_delete",
            "trg_offers_status_audit",
            "trg_offers_validate_equity",
        ):
            conn.execute(text(f"IF OBJECT_ID('{trg}', 'TR') IS NOT NULL DROP TRIGGER {trg}"))
        for sp in ("sp_idea_stats", "sp_owner_percent", "sp_global_stats"):
            conn.execute(text(f"IF OBJECT_ID('{sp}', 'P') IS NOT NULL DROP PROCEDURE {sp}"))
        # alembic_version may or may not exist
        conn.execute(text("IF OBJECT_ID('alembic_version', 'U') IS NOT NULL DROP TABLE alembic_version"))

    Base.metadata.drop_all(bind=engine)
    run_migrations()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _reset_data():
    """Wipe data (but keep schema) between tests."""
    s = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            s.execute(table.delete())
        s.commit()
    finally:
        s.close()


def _new_idea(s, title="Test Idea") -> str:
    iid = str(uuid.uuid4())
    s.add(models.Idea(
        id=iid, title=title, industry="AI", stage="MVP",
        description="Long enough description for tests", created_by="Owner",
        created_at=date.today(),
    ))
    s.commit()
    return iid


def _new_offer(s, idea_id, equity, status="Pending", investor="Inv"):
    oid = str(uuid.uuid4())
    s.add(models.Offer(
        id=oid, idea_id=idea_id, investor_name=investor, amount=10000,
        equity=equity, message="msg", status=status, created_at=date.today(),
    ))
    s.commit()
    return oid


# ── Stored procedures ────────────────────────────────────────────────────────


def test_sp_global_stats():
    s = SessionLocal()
    try:
        i1 = _new_idea(s, "A")
        i2 = _new_idea(s, "B")
        _new_offer(s, i1, equity=10, status="Accepted")
        _new_offer(s, i1, equity=5, status="Pending")
        _new_offer(s, i2, equity=20, status="Rejected")
        s.add(models.Feedback(
            id=str(uuid.uuid4()), idea_id=i1, user="X", rating=4,
            comment="Solid idea overall", created_at=date.today(),
        ))
        s.commit()

        row = s.execute(text("EXEC sp_global_stats")).mappings().first()
        assert row["total_ideas"] == 2
        assert row["total_offers"] == 3
        assert row["accepted_offers"] == 1
        assert row["pending_offers"] == 1
        assert row["rejected_offers"] == 1
        assert row["total_feedback"] == 1
        assert abs(row["avg_rating"] - 4.0) < 0.001
    finally:
        s.close()


def test_sp_owner_percent():
    s = SessionLocal()
    try:
        i = _new_idea(s)
        _new_offer(s, i, equity=15, status="Accepted")
        _new_offer(s, i, equity=25, status="Accepted")
        _new_offer(s, i, equity=10, status="Pending")  # not accepted, ignored

        result = s.execute(
            text("DECLARE @p FLOAT; EXEC sp_owner_percent :iid, @p OUTPUT; SELECT @p AS pct"),
            {"iid": i},
        ).mappings().first()
        assert abs(result["pct"] - 60.0) < 0.001
    finally:
        s.close()


def test_sp_idea_stats():
    s = SessionLocal()
    try:
        i = _new_idea(s, "Target")
        _new_offer(s, i, equity=10, status="Accepted")
        _new_offer(s, i, equity=5, status="Pending")
        s.add(models.Feedback(
            id=str(uuid.uuid4()), idea_id=i, user="X", rating=5,
            comment="Excellent product idea", created_at=date.today(),
        ))
        s.commit()

        row = s.execute(text("EXEC sp_idea_stats :iid"), {"iid": i}).mappings().first()
        assert row["total_offers"] == 2
        assert row["accepted_offers"] == 1
        assert row["pending_offers"] == 1
        assert abs(row["owner_percent"] - 90.0) < 0.001
        assert abs(row["avg_rating"] - 5.0) < 0.001
    finally:
        s.close()


# ── Triggers ─────────────────────────────────────────────────────────────────


def test_trg_validate_equity_blocks_overlimit_insert():
    """Defense-in-depth: even bypassing the API, the DB rejects equity > available."""
    from sqlalchemy.exc import DBAPIError

    s = SessionLocal()
    try:
        i = _new_idea(s)
        _new_offer(s, i, equity=80, status="Accepted")  # owner now at 20%

        with pytest.raises(DBAPIError):
            s.execute(
                text("""
                    INSERT INTO offers (id, idea_id, investor_name, amount, equity, message, status, created_at)
                    VALUES (:id, :idea_id, 'X', 1000, 25, 'too much', 'Pending', CAST(GETDATE() AS DATE))
                """),
                {"id": str(uuid.uuid4()), "idea_id": i},
            )
            s.commit()
    finally:
        s.rollback()
        s.close()


def test_trg_status_audit_logs_changes():
    s = SessionLocal()
    try:
        i = _new_idea(s)
        oid = _new_offer(s, i, equity=10, status="Pending")

        s.execute(
            text("UPDATE offers SET status = 'Accepted' WHERE id = :oid"),
            {"oid": oid},
        )
        s.commit()

        rows = s.execute(
            text("SELECT old_status, new_status FROM offer_status_audit WHERE offer_id = :oid"),
            {"oid": oid},
        ).mappings().all()
        assert len(rows) == 1
        assert rows[0]["old_status"] == "Pending"
        assert rows[0]["new_status"] == "Accepted"
    finally:
        s.close()


def test_trg_block_accepted_delete():
    """Even if the API is bypassed, the trigger refuses to delete Accepted offers."""
    from sqlalchemy.exc import DBAPIError

    s = SessionLocal()
    try:
        i = _new_idea(s)
        oid = _new_offer(s, i, equity=10, status="Accepted")

        with pytest.raises(DBAPIError):
            s.execute(text("DELETE FROM offers WHERE id = :oid"), {"oid": oid})
            s.commit()
    finally:
        s.rollback()
        s.close()
