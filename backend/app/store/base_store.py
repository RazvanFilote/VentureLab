"""Generic SQLAlchemy-backed store.

Each subclass binds a single ORM model. The shape of the methods matches the
old in-RAM store so router code does not have to change — they take/return
plain dicts. Sessions are passed in by the FastAPI dependency.
"""
import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Date, DateTime
from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def _to_dict(obj) -> Dict[str, Any]:
    if obj is None:
        return None
    out: Dict[str, Any] = {}
    for col in obj.__table__.columns:
        v = getattr(obj, col.name)
        if isinstance(v, (date, datetime)):
            v = v.isoformat()
        elif hasattr(v, "value"):  # enum
            v = v.value
        out[col.name] = v
    return out


def _coerce_value(model, key: str, value: Any) -> Any:
    """Convert ISO date strings to date objects for Date columns. Pydantic
    keeps these as plain str on the wire; SQLAlchemy's SQLite/SQL Server Date
    type wants real ``date`` instances."""
    if value is None or not isinstance(value, str):
        return value
    col = model.__table__.columns.get(key)
    if col is None:
        return value
    if isinstance(col.type, Date) and not isinstance(col.type, DateTime):
        try:
            return date.fromisoformat(value)
        except ValueError:
            return value
    if isinstance(col.type, DateTime):
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            return value
    return value


def _coerce_payload(model, data: Dict[str, Any]) -> Dict[str, Any]:
    return {k: _coerce_value(model, k, v) for k, v in data.items()}


class BaseStore:
    model = None  # set by subclasses

    def _session(self, db: Optional[Session] = None) -> tuple[Session, bool]:
        if db is not None:
            return db, False
        return SessionLocal(), True

    def reset(self, db: Optional[Session] = None) -> None:
        s, owned = self._session(db)
        try:
            s.query(self.model).delete()
            s.commit()
        finally:
            if owned:
                s.close()

    def all(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            return [_to_dict(o) for o in s.query(self.model).all()]
        finally:
            if owned:
                s.close()

    def get(self, item_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            return _to_dict(s.get(self.model, item_id))
        finally:
            if owned:
                s.close()

    def create(self, data: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        s, owned = self._session(db)
        try:
            payload = _coerce_payload(self.model, data)
            cols = self.model.__table__.columns
            if "id" in cols:
                payload.setdefault("id", str(uuid.uuid4()))
            if "created_at" in cols:
                payload.setdefault("created_at", date.today())
            # Drop any keys that aren't real columns (e.g. password is a column,
            # but stray fields would fail SQLAlchemy's strict constructor).
            payload = {k: v for k, v in payload.items() if k in cols}
            obj = self.model(**payload)
            s.add(obj)
            s.commit()
            s.refresh(obj)
            return _to_dict(obj)
        finally:
            if owned:
                s.close()

    def update(self, item_id: str, data: Dict[str, Any], db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            obj = s.get(self.model, item_id)
            if obj is None:
                return None
            for key, value in _coerce_payload(self.model, data).items():
                if value is not None and hasattr(obj, key):
                    setattr(obj, key, value)
            s.commit()
            s.refresh(obj)
            return _to_dict(obj)
        finally:
            if owned:
                s.close()

    def delete(self, item_id: str, db: Optional[Session] = None) -> bool:
        s, owned = self._session(db)
        try:
            obj = s.get(self.model, item_id)
            if obj is None:
                return False
            s.delete(obj)
            s.commit()
            return True
        finally:
            if owned:
                s.close()
