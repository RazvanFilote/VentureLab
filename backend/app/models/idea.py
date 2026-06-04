from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class Industry(str, Enum):
    HealthTech = "HealthTech"
    FinTech = "FinTech"
    EdTech = "EdTech"
    AI = "AI"
    SaaS = "SaaS"
    ECommerce = "E-commerce"
    Other = "Other"


class Stage(str, Enum):
    Idea = "Idea"
    MVP = "MVP"
    Growth = "Growth"
    Scale = "Scale"


class IdeaCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    industry: Industry
    stage: Stage
    description: str = Field(..., min_length=10, max_length=2000)
    created_by: str = Field(..., min_length=1, max_length=100)


class IdeaUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    industry: Optional[Industry] = None
    stage: Optional[Stage] = None
    description: Optional[str] = Field(None, min_length=10, max_length=2000)


class IdeaOut(BaseModel):
    id: str
    title: str
    industry: str
    stage: str
    description: str
    created_by: str
    created_at: str
