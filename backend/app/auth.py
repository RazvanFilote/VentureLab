"""Authentication primitives shared by routers and tests.

- Passwords are hashed with bcrypt via passlib.
- Sessions are JWTs (HS256). They embed user_id, email, role, and a 2-hour
  expiry (override via VENTURELAB_TOKEN_TTL_SEC); every request from the SPA
  refreshes the token by hitting /me, so inactivity past the window forces a
  re-login.
- `get_current_user` is the FastAPI dependency every protected route uses.
- `require_admin` is a tighter dependency for /api/users.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import User


SECRET_KEY = os.environ.get("VENTURELAB_JWT_SECRET", "dev-insecure-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.environ.get("VENTURELAB_TOKEN_TTL_SEC", "7200"))


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# tokenUrl is documentation only; the SPA posts JSON, not form data.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def create_access_token(*, user_id: str, email: str, role: str) -> tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS)
    payload = {"sub": user_id, "email": email, "role": role, "exp": expire}
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token, expire


def _credentials_error(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise _credentials_error("Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise _credentials_error("Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise _credentials_error()
    user = db.get(User, user_id)
    if not user:
        raise _credentials_error("User no longer exists")
    return user


def require_admin(current: User = Depends(get_current_user)) -> User:
    role = current.role.value if hasattr(current.role, "value") else current.role
    if role != "Admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return current
