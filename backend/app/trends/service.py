import uuid
from dataclasses import dataclass, field

from fastapi import HTTPException
from sqlalchemy import case, func
from sqlalchemy.orm import Session, selectinload

from app.models import TagType, Trend, TrendTag, User
from app.schemas import PaginatedTrends, ScoredTrendResponse, TrendResponse, TrendTagSchema


# ── Contexte utilisateur ──────────────────────────────────────────────────────

@dataclass(frozen=True)
class _UserContext:
    role: str
    target_ages: frozenset[str] = field(default_factory=frozenset)
    interest_slugs: frozenset[str] = field(default_factory=frozenset)


def _load_user_context(user_id: uuid.UUID, db: Session) -> _UserContext:
    user: User | None = db.query(User).filter(User.id == user_id).first()
    if not user:
        return _UserContext(role="")
    return _UserContext(
        role=user.role.value if user.role else "",
        target_ages=frozenset(user.target_ages or []),
        interest_slugs=frozenset(i.slug for i in user.interests),
    )


# ── Moteur de recommandation ──────────────────────────────────────────────────

def get_personalized_trends(
    user_id: uuid.UUID,
    db: Session,
    skip: int = 0,
    limit: int = 20,
) -> PaginatedTrends:
    """
    Scoring par tag :
      • Intérêt matching (INTEREST ↔ user.interests)  → +3 pts
      • Tranche d'âge matching (GENERATION ↔ target_ages) → +2 pts
      • Rôle matching (ROLE ↔ user.role)               → +1 pt
      • score_base éditorial                            → +N pts
    """
    ctx = _load_user_context(user_id, db)
    interest_slugs_list = list(ctx.interest_slugs)
    target_ages_list    = list(ctx.target_ages)

    tag_score = case(
        (
            (TrendTag.tag_type == TagType.INTEREST)
            & (TrendTag.value.in_(interest_slugs_list) if interest_slugs_list else False),
            3,
        ),
        (
            (TrendTag.tag_type == TagType.GENERATION)
            & (TrendTag.value.in_(target_ages_list) if target_ages_list else False),
            2,
        ),
        (
            (TrendTag.tag_type == TagType.ROLE)
            & (TrendTag.value == ctx.role),
            1,
        ),
        else_=0,
    )

    score_subq = (
        db.query(
            Trend.id.label("trend_id"),
            (Trend.score_base + func.coalesce(func.sum(tag_score), 0)).label("affinity_score"),
        )
        .outerjoin(TrendTag, TrendTag.trend_id == Trend.id)
        .group_by(Trend.id)
        .subquery()
    )

    total: int = db.query(func.count()).select_from(score_subq).scalar() or 0

    rows = (
        db.query(Trend, score_subq.c.affinity_score)
        .join(score_subq, score_subq.c.trend_id == Trend.id)
        .options(selectinload(Trend.tags))
        .order_by(score_subq.c.affinity_score.desc(), Trend.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    items = [
        ScoredTrendResponse(
            id=trend.id, title=trend.title, description=trend.description,
            context=trend.context, usage_example=trend.usage_example, usage_keys=trend.usage_keys,
            score_base=trend.score_base, status=trend.status,
            category=trend.category, region=trend.region, age_range=trend.age_range,
            image_url=trend.image_url, platforms=trend.platforms, badges=trend.badges,
            extra_stats=trend.extra_stats, rank=trend.rank, created_at=trend.created_at,
            tags=[TrendTagSchema(tag_type=t.tag_type, value=t.value) for t in trend.tags],
            affinity_score=affinity_score,
        )
        for trend, affinity_score in rows
    ]

    return PaginatedTrends(total=total, items=items, skip=skip, limit=limit)


def get_all_trends(
    db: Session,
    category: str | None = None,
    q: str | None = None,
    skip: int = 0,
    limit: int = 20,
):
    from app.schemas import TrendListResponse

    query = db.query(Trend).options(selectinload(Trend.tags))

    if category:
        query = query.filter(Trend.category.ilike(category))
    if q:
        query = query.filter(
            Trend.title.ilike(f"%{q}%") | Trend.description.ilike(f"%{q}%")
        )

    total: int = query.count()
    rows = (
        query
        .order_by(Trend.rank.asc().nulls_last(), Trend.score_base.desc(), Trend.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    items = [
        TrendResponse(
            id=t.id, title=t.title, description=t.description,
            context=t.context, usage_example=t.usage_example, usage_keys=t.usage_keys,
            score_base=t.score_base, status=t.status,
            category=t.category, region=t.region, age_range=t.age_range,
            image_url=t.image_url, platforms=t.platforms, badges=t.badges,
            extra_stats=t.extra_stats, rank=t.rank, created_at=t.created_at,
            tags=[TrendTagSchema(tag_type=tag.tag_type, value=tag.value) for tag in t.tags],
        )
        for t in rows
    ]

    return TrendListResponse(total=total, items=items, skip=skip, limit=limit)


def get_trend_by_id(trend_id: uuid.UUID, db: Session) -> TrendResponse:
    trend = (
        db.query(Trend)
        .options(selectinload(Trend.tags))
        .filter(Trend.id == trend_id)
        .first()
    )
    if not trend:
        raise HTTPException(status_code=404, detail="Trend not found")
    return TrendResponse(
        id=trend.id, title=trend.title, description=trend.description,
        context=trend.context, usage_example=trend.usage_example, usage_keys=trend.usage_keys,
        score_base=trend.score_base, status=trend.status,
        category=trend.category, region=trend.region, age_range=trend.age_range,
        image_url=trend.image_url, platforms=trend.platforms, badges=trend.badges,
        extra_stats=trend.extra_stats, rank=trend.rank, created_at=trend.created_at,
        tags=[TrendTagSchema(tag_type=t.tag_type, value=t.value) for t in trend.tags],
    )
