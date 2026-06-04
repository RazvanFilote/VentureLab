"""Run Alembic migrations programmatically on app startup.

This lets the server bootstrap a fresh, empty database (created manually in
SSMS) without the user having to run `alembic upgrade head` separately.
"""
import os
from pathlib import Path
from alembic import command
from alembic.config import Config


def run_migrations() -> None:
    here = Path(__file__).resolve().parents[2]  # backend/
    cfg = Config(str(here / "alembic.ini"))
    cfg.set_main_option("script_location", str(here / "alembic"))
    # DATABASE_URL is picked up by env.py from app.db.session, so we don't
    # need to set sqlalchemy.url here.
    command.upgrade(cfg, "head")
