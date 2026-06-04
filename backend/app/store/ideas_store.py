from app.db.models import Idea
from app.store.base_store import BaseStore


class IdeaStore(BaseStore):
    model = Idea


idea_store = IdeaStore()
