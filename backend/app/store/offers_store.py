from typing import List, Dict, Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.db.models import Offer, Idea
from app.store.base_store import BaseStore, _to_dict, _coerce_payload


def _offer_to_dict(offer: Offer) -> Dict[str, Any]:
    """Offer dicts need an idea_title, but the column was dropped for 3NF.
    Compute it from the relationship at serialization time."""
    if offer is None:
        return None
    d = _to_dict(offer)
    d["idea_title"] = offer.idea.title if offer.idea is not None else ""
    return d


class OfferStore(BaseStore):
    model = Offer

    def all(self, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            rows = s.query(Offer).options(joinedload(Offer.idea)).all()
            return [_offer_to_dict(o) for o in rows]
        finally:
            if owned:
                s.close()

    def get(self, item_id: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            obj = (
                s.query(Offer)
                .options(joinedload(Offer.idea))
                .filter(Offer.id == item_id)
                .first()
            )
            return _offer_to_dict(obj) if obj else None
        finally:
            if owned:
                s.close()

    def create(self, data: Dict[str, Any], db: Optional[Session] = None) -> Dict[str, Any]:
        s, owned = self._session(db)
        try:
            from datetime import date
            import uuid as _uuid
            payload = _coerce_payload(Offer, {k: v for k, v in data.items() if k != "idea_title"})
            payload.setdefault("id", str(_uuid.uuid4()))
            payload.setdefault("created_at", date.today())
            payload.setdefault("status", "Pending")
            obj = Offer(**payload)
            s.add(obj)
            s.commit()
            s.refresh(obj)
            s.refresh(obj, attribute_names=["idea"])
            return _offer_to_dict(obj)
        finally:
            if owned:
                s.close()

    def update(self, item_id: str, data: Dict[str, Any], db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            obj = s.get(Offer, item_id)
            if obj is None:
                return None
            for key, value in _coerce_payload(Offer, data).items():
                if value is not None and hasattr(obj, key) and key != "idea_title":
                    setattr(obj, key, value)
            s.commit()
            s.refresh(obj)
            s.refresh(obj, attribute_names=["idea"])
            return _offer_to_dict(obj)
        finally:
            if owned:
                s.close()

    def by_idea(self, idea_id: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            rows = (
                s.query(Offer)
                .options(joinedload(Offer.idea))
                .filter(Offer.idea_id == idea_id)
                .all()
            )
            return [_offer_to_dict(o) for o in rows]
        finally:
            if owned:
                s.close()

    def by_status(self, status: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            rows = (
                s.query(Offer)
                .options(joinedload(Offer.idea))
                .filter(Offer.status == status)
                .all()
            )
            return [_offer_to_dict(o) for o in rows]
        finally:
            if owned:
                s.close()

    def accepted_equity_for_idea(self, idea_id: str, db: Optional[Session] = None) -> float:
        s, owned = self._session(db)
        try:
            total = (
                s.query(func.coalesce(func.sum(Offer.equity), 0.0))
                .filter(Offer.idea_id == idea_id, Offer.status == "Accepted")
                .scalar()
            )
            return float(total or 0.0)
        finally:
            if owned:
                s.close()

    def owner_percent(self, idea_id: str, db: Optional[Session] = None) -> float:
        return max(0.0, 100.0 - self.accepted_equity_for_idea(idea_id, db=db))

    def update_status(self, offer_id: str, status: str, db: Optional[Session] = None):
        return self.update(offer_id, {"status": status}, db=db)


offer_store = OfferStore()
