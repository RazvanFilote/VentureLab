from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import hash_password, require_admin
from app.db.session import get_db
from app.models.user import UserCreate, UserUpdate, UserOut
from app.schemas.pagination import PaginatedResponse, paginate
from app.store.users_store import user_store

router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
    dependencies=[Depends(require_admin)],
)


@router.get("", response_model=PaginatedResponse[UserOut])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return paginate(user_store.all(db), page, page_size)


@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = user_store.get(user_id, db)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    if user_store.get_by_email(body.email, db):
        raise HTTPException(status_code=409, detail="Email already registered")
    payload = body.model_dump()
    payload["password_hash"] = hash_password(payload.pop("password"))
    return user_store.create(payload, db)


@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: str, body: UserUpdate, db: Session = Depends(get_db)):
    if not user_store.get(user_id, db):
        raise HTTPException(status_code=404, detail="User not found")
    if body.email:
        existing = user_store.get_by_email(body.email, db)
        if existing and existing["id"] != user_id:
            raise HTTPException(status_code=409, detail="Email already in use")
    payload = body.model_dump(exclude_none=True)
    if "password" in payload:
        payload["password_hash"] = hash_password(payload.pop("password"))
    return user_store.update(user_id, payload, db)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    if not user_store.delete(user_id, db):
        raise HTTPException(status_code=404, detail="User not found")
