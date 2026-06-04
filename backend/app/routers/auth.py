"""Authentication endpoints.

Sessions are stateless JWTs. /me is the canonical "refresh" — the SPA polls
it on every meaningful action; if the token has expired (30s default), the
SPA gets 401 and forces a re-login.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import (
    ACCESS_TOKEN_EXPIRE_SECONDS,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.models import User, UserRoleEnum
from app.db.session import get_db


router = APIRouter(prefix="/api/auth", tags=["Auth"])


class RegisterIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    role: Optional[UserRoleEnum] = UserRoleEnum.Investor


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserPublic(BaseModel):
    id: str
    name: str
    email: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


def _to_public(u: User) -> UserPublic:
    role = u.role.value if hasattr(u.role, "value") else u.role
    return UserPublic(id=u.id, name=u.name, email=u.email, role=role)


def _issue(u: User) -> TokenOut:
    role = u.role.value if hasattr(u.role, "value") else u.role
    token, _ = create_access_token(user_id=u.id, email=u.email, role=role)
    return TokenOut(
        access_token=token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_SECONDS,
        user=_to_public(u),
    )


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(func.lower(User.email) == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        id=str(uuid.uuid4()),
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role or UserRoleEnum.Investor,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue(user)


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(func.lower(User.email) == body.email.lower())
        .first()
    )
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return _issue(user)


@router.get("/me", response_model=UserPublic)
def me(current: User = Depends(get_current_user)):
    return _to_public(current)


@router.post("/refresh", response_model=TokenOut)
def refresh(current: User = Depends(get_current_user)):
    """Mint a fresh token while the user is active. Frontend calls this on
    user activity so the inactivity logout actually measures idleness."""
    return _issue(current)


@router.post("/logout", status_code=204)
def logout(current: User = Depends(get_current_user)):
    """Stateless — the client drops the token. Provided for API completeness."""
    return None
