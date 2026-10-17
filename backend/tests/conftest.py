from collections.abc import AsyncGenerator

import pytest
from sqlalchemy import delete

from app.core.database import AsyncSessionLocal, engine
from app.models.incident import Incident


@pytest.fixture(autouse=True)
async def cleanup_db() -> AsyncGenerator[None, None]:
    await engine.dispose()
    yield
    async with AsyncSessionLocal() as session:
        await session.execute(delete(Incident))
        await session.commit()
    await engine.dispose()
