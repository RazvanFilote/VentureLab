from typing import Optional
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    idea_id: str = Field(..., min_length=1)
    user: str = Field(..., min_length=1, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=10, max_length=500)


class FeedbackUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, min_length=10, max_length=500)


class FeedbackOut(BaseModel):
    id: str
    idea_id: str
    user: str
    rating: int
    comment: str
    created_at: str
