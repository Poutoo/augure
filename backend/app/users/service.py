import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Interest, User
from app.schemas import OnboardingRequest


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
