import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Resume Analyzer & Job Recommendation System"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Security
    SECRET_KEY: str = "supersecretjwtsecretkeymustbechangedinproduction1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for convenience in dev
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"
    SYNC_DATABASE_URL: str = "sqlite:///./app.db"

    # AI / LLM
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-3-5-sonnet-20241022"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    SPACY_MODEL: str = "en_core_web_md"

    # Storage
    UPLOAD_DIR: str = os.path.join(os.getcwd(), "uploads")
    MAX_FILE_SIZE_MB: int = 5

    # Job API integrations
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    RAPIDAPI_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @validator("SYNC_DATABASE_URL", pre=True, always=True)
    def assemble_sync_db_url(cls, v, values):
        db_url = values.get("DATABASE_URL", "")
        if "sqlite+aiosqlite" in db_url:
            return db_url.replace("sqlite+aiosqlite", "sqlite")
        elif "postgresql+asyncpg" in db_url:
            return db_url.replace("postgresql+asyncpg", "postgresql")
        return v or db_url


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
