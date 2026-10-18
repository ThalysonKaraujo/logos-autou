from uuid import UUID

from sqlalchemy import case, func, or_, select, update
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

    async def list_incidents(
        self,
        status: str | None = None,
        category: str | None = None,
        criticality: str | None = None,
        search: str | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Incident], int]:
        filters = []
        if status:
            filters.append(Incident.status == status)
        if category:
            filters.append(Incident.category == category)
        if criticality:
            filters.append(Incident.criticality == criticality)
        if search:
            search_pattern = f"%{search}%"
            filters.append(
                or_(
                    Incident.title.ilike(search_pattern),
                    Incident.truck_plate.ilike(search_pattern),
                )
            )

        count_statement = select(func.count(Incident.id))
        if filters:
            count_statement = count_statement.where(*filters)
        total_result = await self.db.execute(count_statement)
        total = total_result.scalar_one()

        criticality_priority = case(
            (Incident.criticality == "Alta", 1),
            (Incident.criticality == "Média", 2),
            (Incident.criticality == "Baixa", 3),
            else_=4,
        )

        statement = select(Incident)
        if filters:
            statement = statement.where(*filters)
        statement = (
            statement.order_by(criticality_priority.asc(), Incident.created_at.asc())
            .offset(skip)
            .limit(limit)
        )

        result = await self.db.execute(statement)
        items = list(result.scalars().all())
        return items, total

    async def update_status_with_occ(
        self,
        incident_id: UUID,
        expected_version: int,
        new_status: str,
        analyst_name: str,
        history_entry: IncidentHistory,
    ) -> Incident | None:
        statement = (
            update(Incident)
            .where(
                Incident.id == incident_id,
                Incident.version == expected_version,
            )
            .values(
                status=new_status,
                assigned_to=analyst_name,
                version=Incident.version + 1,
                updated_at=func.now(),
            )
        )
        result = await self.db.execute(statement)
        if getattr(result, "rowcount", 0) == 0:
            await self.db.rollback()
            return None

        history_entry.incident_id = incident_id
        self.db.add(history_entry)
        await self.db.commit()

        self.db.expire_all()
        return await self.get_by_id(incident_id=incident_id)
