from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

router = APIRouter()

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check(db: DatabaseSession) -> dict[str, str]:
    try:
        await db.execute(text("SELECT 1"))
        db_status = "connected"
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed",
        )

    return {
        "status": "healthy",
        "database": db_status,
        "environment": settings.ENVIRONMENT,
    }
