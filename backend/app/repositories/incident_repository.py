from sqlalchemy.ext.asyncio import AsyncSession

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
