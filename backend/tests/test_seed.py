import pytest
from app.core.seed import seed_incidents
from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal
from app.models.incident import Incident, IncidentHistory
from app.schemas.incident import (
    IncidentCategory,
    IncidentCriticality,
    IncidentStatus,
)


@pytest.mark.asyncio
async def test_seed_incidents_fails_with_invalid_count():
    async with AsyncSessionLocal() as session:
        with pytest.raises(ValueError):
            await seed_incidents(db=session, count=0)


@pytest.mark.asyncio
async def test_seed_incidents_skips_when_already_populated_without_reset():
    async with AsyncSessionLocal() as session:
        first_inserted = await seed_incidents(db=session, count=10, reset=True)
        second_inserted = await seed_incidents(db=session, count=10, reset=False)

        total_result = await session.execute(select(func.count(Incident.id)))
        total = total_result.scalar_one()

    assert first_inserted == 10
    assert second_inserted == 0
    assert total == 10


@pytest.mark.asyncio
async def test_seed_incidents_populates_100_incidents_with_audit_history():
    async with AsyncSessionLocal() as session:
        inserted_count = await seed_incidents(db=session, count=100, reset=True)

        incidents_result = await session.execute(select(Incident))
        incidents = list(incidents_result.scalars().all())

        history_result = await session.execute(select(func.count(IncidentHistory.id)))
        history_count = history_result.scalar_one()

    assert inserted_count == 100
    assert len(incidents) == 100
    assert history_count >= 100

    valid_categories = {item.value for item in IncidentCategory}
    valid_criticalities = {item.value for item in IncidentCriticality}
    valid_statuses = {item.value for item in IncidentStatus}

    found_categories = {inc.category for inc in incidents}
    found_criticalities = {inc.criticality for inc in incidents}
    found_statuses = {inc.status for inc in incidents}

    assert found_categories == valid_categories
    assert found_criticalities == valid_criticalities
    assert found_statuses == valid_statuses
