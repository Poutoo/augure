import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import User
from app.schemas import RegisterRequest


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    return jwt.encode(
        {"sub": str(user_id), "exp": expire},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def register_user(payload: RegisterRequest, db: Session) -> User:
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )
    if payload.username:
        taken = db.query(User).filter(
            func.lower(User.username) == payload.username.strip().lower()
        ).first()
        if taken:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce pseudo est déjà utilisé",
            )
    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        username=payload.username.strip() if payload.username else None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(email: str, password: str, db: Session) -> User | None:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user
