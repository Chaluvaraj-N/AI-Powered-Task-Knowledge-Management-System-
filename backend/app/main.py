from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.init_db import init_db
from app.api.routes import auth, users, documents, tasks, search, analytics, activity_logs

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "MVP backend for the AI-Powered Task & Knowledge Management System. "
        "Provides JWT auth + RBAC, document upload with local semantic search "
        "(TF-IDF + SVD embeddings stored in FAISS), task management with dynamic "
        "filtering, activity logging, and basic analytics."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(documents.router, prefix=settings.API_V1_PREFIX)
app.include_router(tasks.router, prefix=settings.API_V1_PREFIX)
app.include_router(search.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(activity_logs.router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    return {"status": "ok", "service": settings.APP_NAME}


@app.get("/health")
def health():
    return {"status": "healthy"}
