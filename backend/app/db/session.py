"""SQLAlchemy engine + session factory.

The DATABASE_URL env var picks the backend. Default is a local SQL Server
Express instance with Windows authentication. Tests override it via env.

Examples:
    Postgres (Supabase / production — pooled connection, port 6543):
        postgresql://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
    SQL Server (Windows auth):
        mssql+pyodbc://@localhost\\SQLEXPRESS/venturelab?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes
    SQL Server (SQL auth):
        mssql+pyodbc://sa:Pass123@localhost/venturelab?driver=ODBC+Driver+17+for+SQL+Server
    SQLite (used by the test suite):
        sqlite:///./test.db

The app runs identically on Postgres and SQLite via the ORM path; the SQL
Server stored procedures/triggers (migration 0002) are an MSSQL-only
optimisation and are skipped elsewhere — all business rules are also enforced
in the routers (see app/routers/offers.py).
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


DEFAULT_URL = (
    "mssql+pyodbc://@localhost\\SQLEXPRESS/venturelab"
    "?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
)

DATABASE_URL = os.environ.get("DATABASE_URL", DEFAULT_URL)

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, future=True, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)

Base = declarative_base()


def get_db():
    """FastAPI dependency yielding a session and closing it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
