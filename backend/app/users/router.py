from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import (
    AvatarResponse,
    OnboardingRequest,
    OnboardingResponse,
    PlanRequest,
    ProfileResponse,
    ProfileUpdateRequest,
)
from app.users import service as users_service

router = APIRouter(prefix="/user", tags=["users"])


@router.get("/me", response_model=ProfileResponse, summary="Récupérer le profil courant")
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProfileResponse:
    return users_service.get_me(current_user.id, db)


@router.post(
    "/onboarding",
    response_model=OnboardingResponse,
    summary="Enregistrer le rôle, la génération cible et les centres d'intérêt",
)
def onboarding(
    payload: OnboardingRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OnboardingResponse:
    return users_service.save_onboarding(current_user.id, payload, db)


@router.patch(
    "/plan",
    response_model=OnboardingResponse,
    summary="Enregistrer le plan d'abonnement choisi",
)
def update_plan(
    payload: PlanRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OnboardingResponse:
    return users_service.save_plan(current_user.id, payload, db)


@router.patch(
    "/profile",
    response_model=ProfileResponse,
    summary="Modifier le nom d'utilisateur",
)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProfileResponse:
    return users_service.update_profile(current_user.id, payload, db)


@router.patch(
    "/preferences",
    response_model=ProfileResponse,
    summary="Modifier les préférences (rôle, intérêts, audience)",
)
def update_preferences(
    payload: OnboardingRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProfileResponse:
    return users_service.update_preferences(current_user.id, payload, db)


@router.post(
    "/avatar",
    response_model=AvatarResponse,
    summary="Uploader une photo de profil",
)
def upload_avatar(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    file: UploadFile = File(...),
) -> AvatarResponse:
    url = users_service.upload_avatar(current_user.id, file, db)
    return AvatarResponse(avatar_url=url)
