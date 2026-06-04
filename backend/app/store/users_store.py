from typing import Optional, Dict, Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import User
from app.store.base_store import BaseStore, _to_dict


class UserStore(BaseStore):
    model = User

    def get_by_email(self, email: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        s, owned = self._session(db)
        try:
            obj = (
                s.query(User)
                .filter(func.lower(User.email) == email.lower())
                .first()
            )
            return _to_dict(obj)
        finally:
            if owned:
                s.close()


user_store = UserStore()
