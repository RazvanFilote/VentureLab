from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class MilestoneStatus(str, Enum):
    Pending = "Pending"
    InProgress = "InProgress"
    Done = "Done"


class MilestoneCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field("", max_length=1000)
    status: MilestoneStatus = MilestoneStatus.Pending
    due_date: Optional[str] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[MilestoneStatus] = None
    due_date: Optional[str] = None


class MilestoneOut(BaseModel):
    id: str
    idea_id: str
    title: str
    description: str
    status: str
    due_date: Optional[str]
    created_at: str
