from uuid import UUID

from fastapi import HTTPException, status

from app.models.incident import Incident, IncidentHistory
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import IncidentCreate, IncidentStatus


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
