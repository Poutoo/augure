from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models import User
from app.schemas import OnboardingRequest, OnboardingResponse, PlanRequest
from app.users import service as users_service

router = APIRouter(prefix="/user", tags=["users"])


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
