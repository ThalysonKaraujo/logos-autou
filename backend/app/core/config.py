from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Logos Incident API"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 120

    BACKEND_CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://logos-autou.vercel.app",
    ]
    BACKEND_CORS_ORIGIN_REGEX: str = r"^https://.*\.vercel\.app$"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [
                origin.strip().rstrip("/") for origin in v.split(",") if origin.strip()
            ]
        if isinstance(v, list):
            return [
                str(origin).strip().rstrip("/") for origin in v if str(origin).strip()
            ]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_async_db_url(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith(
                "postgresql+asyncpg://"
            ):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            if "sslmode=" in v:
                v = v.replace("sslmode=", "ssl=")
            if "&channel_binding=require" in v:
                v = v.replace("&channel_binding=require", "")
            elif "channel_binding=require&" in v:
                v = v.replace("channel_binding=require&", "")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
