import asyncio
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy import delete, func, select

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.seed import seed_incidents
from app.models.incident import Incident

engine.echo = False

_had_initial_data: bool | None = None


async def _restore_seed_data() -> None:
    await engine.dispose()
    async with AsyncSessionLocal() as session:
        await seed_incidents(db=session, count=100, reset=True)
    await engine.dispose()


@pytest.fixture(autouse=True)
async def cleanup_db() -> AsyncGenerator[None, None]:
    global _had_initial_data
    await engine.dispose()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        if _had_initial_data is None:
            result = await session.execute(select(func.count(Incident.id)))
            _had_initial_data = result.scalar_one() > 0

        await session.execute(delete(Incident))
        await session.commit()

    yield

    async with AsyncSessionLocal() as session:
        await session.execute(delete(Incident))
        await session.commit()
    await engine.dispose()


def pytest_sessionfinish(session: pytest.Session, exitstatus: int) -> None:
    if _had_initial_data:
        asyncio.run(_restore_seed_data())
