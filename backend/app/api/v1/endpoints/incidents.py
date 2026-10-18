from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import (
    IncidentCategory,
    IncidentCreate,
    IncidentCriticality,
    IncidentDetailResponse,
    IncidentListResponse,
    IncidentResponse,
    IncidentStatus,
    IncidentStatusUpdate,
)
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


@router.get(
    "",
    response_model=IncidentListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_incidents_endpoint(
    service: IncidentServiceDep,
    status: IncidentStatus | None = None,
    category: IncidentCategory | None = None,
    criticality: IncidentCriticality | None = None,
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> IncidentListResponse:
    items, total = await service.list_incidents(
        status=status,
        category=category,
        criticality=criticality,
        search=search,
        skip=skip,
        limit=limit,
    )
    return IncidentListResponse(
        items=[IncidentResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get(
    "/{incident_id}",
    response_model=IncidentDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def get_incident_by_id_endpoint(
    incident_id: UUID,
    service: IncidentServiceDep,
) -> IncidentDetailResponse:
    incident = await service.get_incident_by_id(incident_id=incident_id)
    return IncidentDetailResponse.model_validate(incident)


@router.patch(
    "/{incident_id}/status",
    response_model=IncidentDetailResponse,
    status_code=status.HTTP_200_OK,
)
async def update_incident_status_endpoint(
    incident_id: UUID,
    payload: IncidentStatusUpdate,
    service: IncidentServiceDep,
) -> IncidentDetailResponse:
    incident = await service.update_incident_status(
        incident_id=incident_id, payload=payload
    )
    return IncidentDetailResponse.model_validate(incident)
