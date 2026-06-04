from enum import Enum
from pydantic import BaseModel, Field, field_validator


class OfferStatus(str, Enum):
    Pending = "Pending"
    Accepted = "Accepted"
    Rejected = "Rejected"


class OfferCreate(BaseModel):
    idea_id: str = Field(..., min_length=1)
    idea_title: str = Field(..., min_length=1, max_length=200)
    investor_name: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    equity: float = Field(..., gt=0, le=100)
    message: str = Field(..., min_length=5, max_length=1000)


class OfferStatusUpdate(BaseModel):
    status: OfferStatus

    @field_validator("status")
    @classmethod
    def not_pending(cls, v: OfferStatus) -> OfferStatus:
        if v == OfferStatus.Pending:
            raise ValueError("Cannot set status back to Pending")
        return v


class OfferOut(BaseModel):
    id: str
    idea_id: str
    idea_title: str
    investor_name: str
    amount: float
    equity: float
    message: str
    status: str
    created_at: str
