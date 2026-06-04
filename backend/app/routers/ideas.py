from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.idea import IdeaCreate, IdeaUpdate, IdeaOut
from app.schemas.pagination import PaginatedResponse, paginate
from app.store.ideas_store import idea_store

router = APIRouter(
    prefix="/api/ideas",
    tags=["Ideas"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=PaginatedResponse[IdeaOut])
def list_ideas(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return paginate(idea_store.all(db), page, page_size)


@router.get("/{idea_id}", response_model=IdeaOut)
def get_idea(idea_id: str, db: Session = Depends(get_db)):
    idea = idea_store.get(idea_id, db)
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    return idea


@router.post("", response_model=IdeaOut, status_code=201)
def create_idea(body: IdeaCreate, db: Session = Depends(get_db)):
    return idea_store.create(body.model_dump(), db)


@router.put("/{idea_id}", response_model=IdeaOut)
def update_idea(idea_id: str, body: IdeaUpdate, db: Session = Depends(get_db)):
    updated = idea_store.update(idea_id, body.model_dump(exclude_none=True), db)
    if not updated:
        raise HTTPException(status_code=404, detail="Idea not found")
    return updated


@router.delete("/{idea_id}", status_code=204)
def delete_idea(idea_id: str, db: Session = Depends(get_db)):
    if not idea_store.delete(idea_id, db):
        raise HTTPException(status_code=404, detail="Idea not found")
