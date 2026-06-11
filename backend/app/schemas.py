import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import TagType, TrendStatus, UserRole


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    username: str | None = Field(default=None, max_length=100)


class RegisterResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Onboarding ────────────────────────────────────────────────────────────────

class OnboardingRequest(BaseModel):
    role: UserRole
    # Tranches d'âge : "13-17", "18-24", "25-34", "35-44", "45-65", "65-plus"
    target_ages: list[str] = Field(min_length=1)
    # Réseaux sociaux : "tiktok", "instagram", "youtube", "pinterest", "x", "facebook"
    target_networks: list[str] = []
    # Géographie : "france", "europe", "amerique-nord", "amerique-sud", "asie", "afrique", "international"
    target_geography: list[str] = []
    # Genre : "homme", "femme", "tous", "autre"
    target_gender: str | None = None
    # Centres d'intérêt — slugs issus de la table interests
    interest_slugs: list[str] = Field(min_length=1, max_length=10)

    @field_validator("interest_slugs")
    @classmethod
    def normalise_slugs(cls, v: list[str]) -> list[str]:
        cleaned = [s.strip().lower() for s in v]
        if any(not s for s in cleaned):
            raise ValueError("interest slugs must not be blank")
        return list(dict.fromkeys(cleaned))

    @field_validator("target_ages")
    @classmethod
    def normalise_ages(cls, v: list[str]) -> list[str]:
        valid = {"13-17", "18-24", "25-34", "35-44", "45-65", "65-plus"}
        invalid = [a for a in v if a not in valid]
        if invalid:
            raise ValueError(f"Unknown age ranges: {invalid}")
        return list(dict.fromkeys(v))


class InterestSchema(BaseModel):
    id: int
    name: str
    slug: str

    model_config = {"from_attributes": True}


class OnboardingResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str | None
    role: UserRole
    target_ages: list | None
    target_networks: list | None
    target_geography: list | None
    target_gender: str | None
    interests: list[InterestSchema]

    model_config = {"from_attributes": True}


# ── Trends ────────────────────────────────────────────────────────────────────

class TrendTagSchema(BaseModel):
    tag_type: TagType
    value: str

    model_config = {"from_attributes": True}


class StatSchema(BaseModel):
    label: str
    value: str


class TrendResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    context: str
    usage_example: str
    usage_keys: list[str] | None = None
    score_base: int
    status: TrendStatus
    category: str | None = None
    region: str | None = None
    age_range: str | None = None
    image_url: str | None = None
    platforms: list[str] | None = None
    badges: list[str] | None = None
    extra_stats: list[StatSchema] | None = None
    rank: int | None = None
    created_at: datetime
    tags: list[TrendTagSchema] = []

    model_config = {"from_attributes": True}


class ScoredTrendResponse(TrendResponse):
    affinity_score: int


class PaginatedTrends(BaseModel):
    total: int
    items: list[ScoredTrendResponse]
    skip: int
    limit: int


class TrendListResponse(BaseModel):
    total: int
    items: list[TrendResponse]
    skip: int
    limit: int
