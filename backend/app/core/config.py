from pydantic_settings import BaseSettings
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    # ---- General ----
    APP_NAME: str = "AI-Powered Task & Knowledge Management System"
    API_V1_PREFIX: str = "/api"

    # ---- Database ----
    # For MySQL (required by the assignment) set DATABASE_URL, e.g.:
    #   mysql+pymysql://root:password@localhost:3306/task_ai_db
    # If left unset, falls back to a local SQLite file so the app can be
    # run and evaluated instantly without a MySQL server installed.
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'storage' / 'app.db'}"

    # ---- JWT ----
    JWT_SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours

    # ---- Storage ----
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "uploads"
    VECTOR_STORE_DIR: Path = BASE_DIR / "storage" / "vector_store"

    # ---- AI / Embeddings ----
    EMBEDDING_DIM: int = 128
    CHUNK_SIZE_WORDS: int = 120
    CHUNK_OVERLAP_WORDS: int = 20
    TOP_K_RESULTS: int = 5

    # ---- CORS ----
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.VECTOR_STORE_DIR.mkdir(parents=True, exist_ok=True)
