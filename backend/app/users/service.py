import uuid
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from supabase import create_client
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Interest, User
from app.schemas import OnboardingRequest, PlanRequest, ProfileUpdateRequest


def get_me(user_id: uuid.UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def save_onboarding(user_id: uuid.UUID, payload: OnboardingRequest, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    interests = db.query(Interest).filter(Interest.slug.in_(payload.interest_slugs)).all()

    found_slugs = {i.slug for i in interests}
    missing = set(payload.interest_slugs) - found_slugs
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown interest slugs: {sorted(missing)}",
        )

    user.role             = payload.role
    user.target_ages      = payload.target_ages
    user.target_networks  = payload.target_networks
    user.target_geography = payload.target_geography
    user.target_gender    = payload.target_gender
    user.interests        = interests

    db.commit()
    db.refresh(user)
    return user


def save_plan(user_id: uuid.UUID, payload: PlanRequest, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.plan = payload.plan
    db.commit()
    db.refresh(user)
    return user


def update_profile(user_id: uuid.UUID, payload: ProfileUpdateRequest, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.username is not None:
        existing = (
            db.query(User)
            .filter(User.username == payload.username, User.id != user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce nom d'utilisateur est déjà pris",
            )
        user.username = payload.username

    db.commit()
    db.refresh(user)
    return user


def update_preferences(user_id: uuid.UUID, payload: OnboardingRequest, db: Session) -> User:
    return save_onboarding(user_id, payload, db)


def upload_avatar(user_id: uuid.UUID, file: UploadFile, db: Session) -> str:
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage non configuré",
        )

    ext = (file.filename or "avatar").rsplit(".", 1)[-1].lower()
    if ext not in {"jpg", "jpeg", "png", "webp", "gif"}:
        ext = "jpg"

    path = f"{user_id}/{uuid4()}.{ext}"
    content = file.file.read()

    supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    supabase_client.storage.from_("avatars").upload(
        path,
        content,
        {"content-type": file.content_type or "image/jpeg", "upsert": "true"},
    )
    public_url: str = supabase_client.storage.from_("avatars").get_public_url(path)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.avatar_url = public_url
    db.commit()
    db.refresh(user)
    return public_url
