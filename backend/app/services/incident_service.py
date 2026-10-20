from datetime import UTC, date, datetime, time
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status

from app.models.incident import Incident, IncidentHistory
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import (
    IncidentCategory,
    IncidentCreate,
    IncidentCriticality,
    IncidentSortBy,
    IncidentStatus,
    IncidentStatusUpdate,
    IncidentUpdate,
)


def _resolve_created_at(value: date | datetime | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    return datetime.combine(value, time(12, 0), tzinfo=UTC)


def _format_incident_state(incident: Incident | None) -> dict[str, Any] | None:
    if not incident:
        return None
    return {
        "id": str(incident.id),
        "title": incident.title,
        "description": incident.description,
        "category": incident.category,
        "criticality": incident.criticality,
        "status": incident.status,
        "location": incident.location,
        "truck_plate": incident.truck_plate,
        "driver_name": incident.driver_name,
        "assigned_to": incident.assigned_to,
        "version": incident.version,
        "created_at": incident.created_at.isoformat() if incident.created_at else None,
        "updated_at": incident.updated_at.isoformat() if incident.updated_at else None,
    }


class IncidentService:
    def __init__(self, repository: IncidentRepository) -> None:
        self.repository = repository

    async def create_incident(self, payload: IncidentCreate) -> Incident:
        custom_created_at = _resolve_created_at(payload.created_at)
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
            **({"created_at": custom_created_at} if custom_created_at else {}),
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
        date_from: date | datetime | None = None,
        date_to: date | datetime | None = None,
        sort_by: IncidentSortBy = IncidentSortBy.CRITICALITY_DESC,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Incident], int]:
        return await self.repository.list_incidents(
            status=status.value if status else None,
            category=category.value if category else None,
            criticality=criticality.value if criticality else None,
            search=search,
            date_from=date_from,
            date_to=date_to,
            sort_by=sort_by.value if isinstance(sort_by, IncidentSortBy) else sort_by,
            skip=skip,
            limit=limit,
        )

    async def update_incident_status(
        self,
        incident_id: UUID,
        payload: IncidentStatusUpdate,
        expected_version: int | None = None,
    ) -> Incident:
        target_version = (
            expected_version if expected_version is not None else payload.expected_version
        )
        if target_version is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A versão esperada do incidente deve ser informada via header If-Match ou no campo expected_version",
            )

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
            expected_version=target_version,
            new_status=payload.status.value,
            analyst_name=payload.analyst_name,
            history_entry=history_entry,
        )

        if updated_incident is None:
            latest = await self.repository.get_by_id(incident_id=incident_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Conflito de versão: este incidente já foi atualizado por outro operador",
                    "details": {
                        "expected_version": target_version,
                        "current_version": latest.version if latest else None,
                        "server_state": _format_incident_state(latest),
                    },
                },
            )

        return updated_incident

    async def update_incident(
        self,
        incident_id: UUID,
        payload: IncidentUpdate,
        expected_version: int | None = None,
    ) -> Incident:
        target_version = (
            expected_version if expected_version is not None else payload.expected_version
        )
        if target_version is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A versão esperada do incidente deve ser informada via header If-Match ou no campo expected_version",
            )

        incident = await self.get_incident_by_id(incident_id=incident_id)

        changes: list[str] = []
        if incident.title != payload.title:
            changes.append("Título")
        if incident.description != payload.description:
            changes.append("Descrição")
        if incident.category != payload.category.value:
            changes.append(
                f"Categoria ({incident.category} → {payload.category.value})"
            )
        if incident.criticality != payload.criticality.value:
            changes.append(
                f"Criticidade ({incident.criticality} → {payload.criticality.value})"
            )
        if incident.location != payload.location:
            changes.append("Localização")
        if incident.truck_plate != payload.truck_plate:
            changes.append(f"Placa ({incident.truck_plate} → {payload.truck_plate})")
        if (incident.driver_name or None) != (payload.driver_name or None):
            changes.append("Motorista")

        if not changes and not payload.notes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nenhuma alteração detectada nos dados do incidente",
            )

        summary = (
            f"Alterações: {', '.join(changes)}"
            if changes
            else "Revisão operacional registrada"
        )
        audit_notes = f"{summary} | {payload.notes}" if payload.notes else summary

        history_entry = IncidentHistory(
            analyst_name=payload.analyst_name,
            action="UPDATED",
            from_status=incident.status,
            to_status=incident.status,
            notes=audit_notes[:500],
        )

        updated_incident = await self.repository.update_incident_with_occ(
            incident_id=incident_id,
            expected_version=target_version,
            title=payload.title,
            description=payload.description,
            category=payload.category.value,
            criticality=payload.criticality.value,
            location=payload.location,
            truck_plate=payload.truck_plate,
            driver_name=payload.driver_name,
            analyst_name=payload.analyst_name,
            history_entry=history_entry,
        )

        if updated_incident is None:
            latest = await self.repository.get_by_id(incident_id=incident_id)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Conflito de versão: este incidente já foi atualizado por outro operador",
                    "details": {
                        "expected_version": target_version,
                        "current_version": latest.version if latest else None,
                        "server_state": _format_incident_state(latest),
                    },
                },
            )

        return updated_incident
