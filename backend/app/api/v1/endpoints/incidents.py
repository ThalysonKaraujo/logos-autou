from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.services import incident_service

router = APIRouter()

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_incident_endpoint(
    payload: IncidentCreate,
    db: DatabaseSession,
) -> IncidentResponse:
    incident = await incident_service.create_incident(db=db, payload=payload)
    return IncidentResponse.model_validate(incident)
