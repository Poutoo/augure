from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.router import router as auth_router
from app.comments.router import router as comments_router
from app.community.router import router as community_router
from app.trends.router import router as trends_router
from app.users.router import router as users_router

app = FastAPI(
    title="Augure API",
    description="Moteur de recommandation de tendances culturelles — Augure",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://augure.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=_PREFIX)
app.include_router(users_router, prefix=_PREFIX)
app.include_router(trends_router, prefix=_PREFIX)
app.include_router(comments_router, prefix=_PREFIX)
app.include_router(community_router, prefix=_PREFIX)


@app.get("/health", tags=["monitoring"], include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}
