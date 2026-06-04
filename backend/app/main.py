import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ideas, offers, users, feedback, stats
from app.routers import milestones, auth
from app.db.init_db import run_migrations
from app.seed import seed_all

logger = logging.getLogger("venturelab")


def _flag(name: str, default: bool) -> bool:
    return os.environ.get(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-apply Alembic migrations + seed on startup. Convenient locally, but
    # on serverless (Vercel) this runs on every cold start — prefer running
    # `alembic upgrade head` once against the database and setting
    # VENTURELAB_AUTO_MIGRATE=false so cold starts stay fast. Wrapped in
    # try/except so a transient DB hiccup at boot doesn't crash the function.
    if _flag("VENTURELAB_AUTO_MIGRATE", default=True):
        try:
            run_migrations()
            seed_all()
        except Exception:  # pragma: no cover - defensive boot guard
            logger.exception("Startup migrate/seed failed; continuing to serve")
    yield


app = FastAPI(
    title="VentureLab API",
    description="REST API for the VentureLab startup investment platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Cross-machine setup: the React client runs on a different host, so we
# accept any origin. Lock this down for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(ideas.router)
app.include_router(offers.router)
app.include_router(users.router)
app.include_router(feedback.router)
app.include_router(stats.router)
app.include_router(milestones.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "docs": "/docs"}
