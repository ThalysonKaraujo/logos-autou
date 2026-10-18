from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_response_includes_generated_request_id_and_process_time():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert "x-process-time" in response.headers

    request_id = response.headers["x-request-id"]
    UUID(request_id)

    process_time = response.headers["x-process-time"]
    assert process_time.endswith("ms")
    time_val = float(process_time.replace("ms", ""))
    assert time_val >= 0.0


@pytest.mark.asyncio
async def test_response_preserves_client_provided_request_id():
    custom_request_id = "op-cockpit-trace-777"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"X-Request-ID": custom_request_id},
        )

    assert response.status_code == 200
    assert response.headers.get("x-request-id") == custom_request_id


@pytest.mark.asyncio
async def test_cors_exposes_trace_headers_to_browser():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"Origin": "http://localhost:5173"},
        )

    assert response.status_code == 200
    assert "access-control-expose-headers" in response.headers
    exposed = [
        header.strip().lower()
        for header in response.headers["access-control-expose-headers"].split(",")
    ]
    assert "x-request-id" in exposed
    assert "x-process-time" in exposed
