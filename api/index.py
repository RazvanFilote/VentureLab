"""Vercel Python serverless entrypoint.

Vercel's @vercel/python runtime detects the module-level ASGI ``app`` object
and serves it directly (no Mangum needed). We just put ``backend/`` on the
import path so the existing ``app`` package resolves unchanged, then re-export
the FastAPI instance from app/main.py.

All API routes are already prefixed with ``/api`` (plus ``/health``), and
vercel.json routes those paths to this function while everything else is
served from the built SPA in ``dist/``.
"""
import os
import sys

_BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from app.main import app  # noqa: E402  (path setup must run first)

__all__ = ["app"]
