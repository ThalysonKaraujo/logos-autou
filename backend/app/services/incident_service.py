from uuid import UUID

from fastapi import HTTPException, status

from app.models.incident import Incident, IncidentHistory
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import (
    IncidentCategory,
    IncidentCreate,
    IncidentCriticality,
    IncidentStatus,
    IncidentStatusUpdate,
)


class IncidentService:
    def __init__(self, repository: IncidentRepository) -> None:
        self.repository = repository

    async def create_incident(self, payload: IncidentCreate) -> Incident:
        incident = Incident(
            title=payload.title,
            description=payload.description,
            category=payload.category.value,
            criticality=payload.criticality.value,
            status=IncidentStatus.ABERTO.value,
            location=payload.location,
            truck_plate=payload.truck_plate,
            driver_name=payload.driver_name,
            version=1,
        )

        history_entry = IncidentHistory(
            analyst_name="Sistema",
            action="CREATED",
            from_status=None,
            to_status=IncidentStatus.ABERTO.value,
            notes="Incidente registrado no sistema",
        )

        return await self.repository.create(
            incident=incident, history_entry=history_entry
        )

    async def get_incident_by_id(self, incident_id: UUID) -> Incident:
        incident = await self.repository.get_by_id(incident_id=incident_id)
        if incident is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incidente não encontrado",
            )
        return incident

    async def list_incidents(
        self,
        status: IncidentStatus | None = None,
        category: IncidentCategory | None = None,
        criticality: IncidentCriticality | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Incident], int]:
        return await self.repository.list_incidents(
            status=status.value if status else None,
            category=category.value if category else None,
            criticality=criticality.value if criticality else None,
            search=search,
            skip=skip,
            limit=limit,
        )

    async def update_incident_status(
        self, incident_id: UUID, payload: IncidentStatusUpdate
    ) -> Incident:
        incident = await self.get_incident_by_id(incident_id=incident_id)

        if incident.status == payload.status.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O incidente já se encontra neste status",
            )

        history_entry = IncidentHistory(
            analyst_name=payload.analyst_name,
            action="STATUS_CHANGED",
            from_status=incident.status,
            to_status=payload.status.value,
            notes=payload.notes,
        )

        updated_incident = await self.repository.update_status_with_occ(
            incident_id=incident_id,
            expected_version=payload.expected_version,
            new_status=payload.status.value,
            analyst_name=payload.analyst_name,
            history_entry=history_entry,
        )

        if updated_incident is None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Conflito de versão: este incidente já foi atualizado por outro operador",
            )

        return updated_incident
