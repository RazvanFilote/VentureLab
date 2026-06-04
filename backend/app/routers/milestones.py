from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db.session import get_db
from app.models.milestone import MilestoneCreate, MilestoneUpdate, MilestoneOut
from app.store.milestone_store import milestone_store
from app.store.ideas_store import idea_store

router = APIRouter(
    prefix="/api/ideas",
    tags=["Milestones"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/{idea_id}/milestones", response_model=List[MilestoneOut])
def list_milestones(idea_id: str, db: Session = Depends(get_db)):
    if not idea_store.get(idea_id, db):
        raise HTTPException(status_code=404, detail="Idea not found")
    return milestone_store.by_idea(idea_id, db)


@router.post("/{idea_id}/milestones", response_model=MilestoneOut, status_code=201)
def create_milestone(idea_id: str, body: MilestoneCreate, db: Session = Depends(get_db)):
    if not idea_store.get(idea_id, db):
        raise HTTPException(status_code=404, detail="Idea not found")
    data = body.model_dump()
    data["idea_id"] = idea_id
    return milestone_store.create(data, db)


@router.get("/{idea_id}/milestones/{milestone_id}", response_model=MilestoneOut)
def get_milestone(idea_id: str, milestone_id: str, db: Session = Depends(get_db)):
    m = milestone_store.get(milestone_id, db)
    if not m or m["idea_id"] != idea_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return m


@router.put("/{idea_id}/milestones/{milestone_id}", response_model=MilestoneOut)
def update_milestone(idea_id: str, milestone_id: str, body: MilestoneUpdate, db: Session = Depends(get_db)):
    m = milestone_store.get(milestone_id, db)
    if not m or m["idea_id"] != idea_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return milestone_store.update(milestone_id, body.model_dump(exclude_none=True), db)


@router.delete("/{idea_id}/milestones/{milestone_id}", status_code=204)
def delete_milestone(idea_id: str, milestone_id: str, db: Session = Depends(get_db)):
    m = milestone_store.get(milestone_id, db)
    if not m or m["idea_id"] != idea_id:
        raise HTTPException(status_code=404, detail="Milestone not found")
    milestone_store.delete(milestone_id, db)
