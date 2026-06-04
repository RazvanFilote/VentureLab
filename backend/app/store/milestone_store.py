from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session

from app.db.models import Milestone
from app.store.base_store import BaseStore, _to_dict


class MilestoneStore(BaseStore):
    model = Milestone

    def by_idea(self, idea_id: str, db: Optional[Session] = None) -> List[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            return [
                _to_dict(m)
                for m in s.query(Milestone).filter(Milestone.idea_id == idea_id).all()
            ]
        finally:
            if owned:
                s.close()

    def completion_rate(self, idea_id: str, db: Optional[Session] = None) -> float:
        items = self.by_idea(idea_id, db=db)
        if not items:
            return 0.0
        done = sum(1 for m in items if m["status"] == "Done")
        return round(done / len(items) * 100, 1)


milestone_store = MilestoneStore()
