from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident import Incident, IncidentHistory
from app.schemas.incident import IncidentCreate, IncidentStatus


async def create_incident(db: AsyncSession, payload: IncidentCreate) -> Incident:
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
    db.add(incident)
    await db.flush()

    history_entry = IncidentHistory(
        incident_id=incident.id,
        analyst_name="Sistema",
        action="CREATED",
        from_status=None,
        to_status=IncidentStatus.ABERTO.value,
        notes="Incidente registrado no sistema",
    )
    db.add(history_entry)

    await db.commit()
    await db.refresh(incident)
    return incident
