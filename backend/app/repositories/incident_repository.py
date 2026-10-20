from datetime import UTC, date, datetime, time
from uuid import UUID

from sqlalchemy import case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.incident import Incident, IncidentHistory


def _normalize_date_from(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=UTC)
    return datetime.combine(value, time.min, tzinfo=UTC)


def _normalize_date_to(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=UTC)
        if dt.hour == 0 and dt.minute == 0 and dt.second == 0 and dt.microsecond == 0:
            return dt.replace(hour=23, minute=59, second=59, microsecond=999999)
        return dt
    return datetime.combine(value, time.max, tzinfo=UTC)


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
        date_from: date | datetime | None = None,
        date_to: date | datetime | None = None,
        sort_by: str = "criticality_desc",
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
                    Incident.location.ilike(search_pattern),
                )
            )
        if date_from:
            filters.append(Incident.created_at >= _normalize_date_from(date_from))
        if date_to:
            filters.append(Incident.created_at <= _normalize_date_to(date_to))

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

        order_clauses = {
            "criticality_desc": [criticality_priority.asc(), Incident.created_at.asc()],
            "criticality_asc": [criticality_priority.desc(), Incident.created_at.asc()],
            "created_at_desc": [Incident.created_at.desc()],
            "created_at_asc": [Incident.created_at.asc()],
            "updated_at_desc": [Incident.updated_at.desc()],
        }
        order_by_clause = order_clauses.get(
            sort_by, [criticality_priority.asc(), Incident.created_at.asc()]
        )

        statement = select(Incident)
        if filters:
            statement = statement.where(*filters)
        statement = statement.order_by(*order_by_clause).offset(skip).limit(limit)

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
                assigned_to=None if new_status == "Aberto" else analyst_name,
                version=Incident.version + 1,
                updated_at=datetime.now(UTC),
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

    async def update_incident_with_occ(
        self,
        incident_id: UUID,
        expected_version: int,
        title: str,
        description: str,
        category: str,
        criticality: str,
        location: str,
        truck_plate: str,
        driver_name: str | None,
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
                title=title,
                description=description,
                category=category,
                criticality=criticality,
                location=location,
                truck_plate=truck_plate,
                driver_name=driver_name,
                assigned_to=analyst_name,
                version=Incident.version + 1,
                updated_at=datetime.now(UTC),
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
