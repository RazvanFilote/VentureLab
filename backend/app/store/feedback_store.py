from typing import List, Dict, Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import Feedback
from app.store.base_store import BaseStore, _to_dict


class FeedbackStore(BaseStore):
    model = Feedback

    def by_idea(self, idea_id: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            return [
                _to_dict(f)
                for f in s.query(Feedback).filter(Feedback.idea_id == idea_id).all()
            ]
        finally:
            if owned:
                s.close()

    def avg_rating(self, idea_id: str, db: Optional[Session] = None) -> float:
        s, owned = self._session(db)
        try:
            avg = (
                s.query(func.avg(Feedback.rating))
                .filter(Feedback.idea_id == idea_id)
                .scalar()
            )
            return float(avg) if avg is not None else 0.0
        finally:
            if owned:
                s.close()


feedback_store = FeedbackStore()
