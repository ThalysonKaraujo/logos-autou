from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import IncidentCreate, IncidentResponse
from app.services.incident_service import IncidentService

router = APIRouter()

DatabaseSession = Annotated[AsyncSession, Depends(get_db)]


def get_incident_service(db: DatabaseSession) -> IncidentService:
    repository = IncidentRepository(db=db)
    return IncidentService(repository=repository)


IncidentServiceDep = Annotated[IncidentService, Depends(get_incident_service)]


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_incident_endpoint(
    payload: IncidentCreate,
    service: IncidentServiceDep,
) -> IncidentResponse:
    incident = await service.create_incident(payload=payload)
    return IncidentResponse.model_validate(incident)
