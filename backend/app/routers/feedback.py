from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.feedback import FeedbackCreate, FeedbackUpdate, FeedbackOut
from app.schemas.pagination import PaginatedResponse, paginate
from app.store.feedback_store import feedback_store

router = APIRouter(
    prefix="/api/feedback",
    tags=["Feedback"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=PaginatedResponse[FeedbackOut])
def list_feedback(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    idea_id: str = Query(None),
    db: Session = Depends(get_db),
):
    items = feedback_store.by_idea(idea_id, db) if idea_id else feedback_store.all(db)
    return paginate(items, page, page_size)


@router.get("/{feedback_id}", response_model=FeedbackOut)
def get_feedback(feedback_id: str, db: Session = Depends(get_db)):
    entry = feedback_store.get(feedback_id, db)
    if not entry:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return entry


@router.post("", response_model=FeedbackOut, status_code=201)
def create_feedback(body: FeedbackCreate, db: Session = Depends(get_db)):
    return feedback_store.create(body.model_dump(), db)


@router.put("/{feedback_id}", response_model=FeedbackOut)
def update_feedback(feedback_id: str, body: FeedbackUpdate, db: Session = Depends(get_db)):
    updated = feedback_store.update(feedback_id, body.model_dump(exclude_none=True), db)
    if not updated:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return updated


@router.delete("/{feedback_id}", status_code=204)
def delete_feedback(feedback_id: str, db: Session = Depends(get_db)):
    if not feedback_store.delete(feedback_id, db):
        raise HTTPException(status_code=404, detail="Feedback not found")
