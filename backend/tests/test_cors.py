import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import app


@pytest.mark.asyncio
async def test_cors_rejects_untrusted_origin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "https://malicious-domain.com",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert "access-control-allow-origin" not in response.headers


@pytest.mark.asyncio
async def test_cors_allows_local_development_origin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.status_code == 200
    assert (
        response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    )


@pytest.mark.asyncio
async def test_cors_allows_vercel_production_and_preview_origins():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        prod_response = await client.options(
            "/api/v1/incidents",
            headers={
                "Origin": "https://logos-autou.vercel.app",
                "Access-Control-Request-Method": "PATCH",
            },
        )
        preview_response = await client.options(
            "/api/v1/incidents",
            headers={
                "Origin": "https://logos-autou-git-feat-cockpit-thalyson.vercel.app",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert prod_response.status_code == 200
    assert (
        prod_response.headers.get("access-control-allow-origin")
        == "https://logos-autou.vercel.app"
    )
    assert preview_response.status_code == 200
    assert (
        preview_response.headers.get("access-control-allow-origin")
        == "https://logos-autou-git-feat-cockpit-thalyson.vercel.app"
    )


def test_settings_normalizes_cors_origins_trailing_slash_and_csv():
    custom_settings = Settings(
        DATABASE_URL="postgresql+asyncpg://logos:logos_secret@localhost:5432/logos_db",
        BACKEND_CORS_ORIGINS="https://logos-autou.vercel.app/, http://localhost:5173/",
    )

    assert custom_settings.BACKEND_CORS_ORIGINS == [
        "https://logos-autou.vercel.app",
        "http://localhost:5173",
    ]
