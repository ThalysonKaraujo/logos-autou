from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.incident import Incident, IncidentHistory


class IncidentRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(
        self, incident: Incident, history_entry: IncidentHistory
    ) -> Incident:
        self.db.add(incident)
        await self.db.flush()

        history_entry.incident_id = incident.id
        self.db.add(history_entry)

        await self.db.commit()
        await self.db.refresh(incident)
        return incident

    async def get_by_id(self, incident_id: UUID) -> Incident | None:
        statement = (
            select(Incident)
            .options(selectinload(Incident.history))
            .where(Incident.id == incident_id)
        )
        result = await self.db.execute(statement)
        return result.scalar_one_or_none()
