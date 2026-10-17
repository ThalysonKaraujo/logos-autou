from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.main import app
from app.models.incident import IncidentHistory


def get_valid_incident_payload() -> dict[str, str]:
    return {
        "title": "Tombamento de carreta na pista central",
        "description": "Caminhão tombou interditando duas faixas sentido sul.",
        "category": "Acidente com Veículo",
        "criticality": "Alta",
        "location": "BR-116, Km 340 - Registro/SP",
        "truck_plate": "BRA2E19",
        "driver_name": "Marcos Oliveira",
    }


@pytest.mark.asyncio
async def test_create_incident_fails_with_empty_payload():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/incidents", json={})

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"
    assert data["message"] == "Erro de validação nos dados enviados"
    assert isinstance(data["details"], list)
    assert len(data["details"]) > 0


@pytest.mark.asyncio
async def test_create_incident_fails_with_invalid_category():
    payload = get_valid_incident_payload()
    payload["category"] = "Categoria Inexistente"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/incidents", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"


@pytest.mark.asyncio
async def test_create_incident_fails_with_invalid_criticality():
    payload = get_valid_incident_payload()
    payload["criticality"] = "Crítica Extrema"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/incidents", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"


@pytest.mark.asyncio
async def test_create_incident_fails_with_short_title():
    payload = get_valid_incident_payload()
    payload["title"] = "Oi"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/incidents", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"


@pytest.mark.asyncio
async def test_create_incident_fails_with_invalid_truck_plate():
    payload = get_valid_incident_payload()
    payload["truck_plate"] = "ABC"

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/incidents", json=payload)

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"


@pytest.mark.asyncio
async def test_create_incident_succeeds():
    payload = get_valid_incident_payload()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/incidents", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["category"] == payload["category"]
    assert data["criticality"] == payload["criticality"]
    assert data["location"] == payload["location"]
    assert data["truck_plate"] == payload["truck_plate"]
    assert data["driver_name"] == payload["driver_name"]
    assert data["status"] == "Aberto"
    assert data["assigned_to"] is None
    assert data["version"] == 1
    assert "created_at" in data
    assert "updated_at" in data

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(IncidentHistory).where(
                IncidentHistory.incident_id == UUID(data["id"])
            )
        )
        history_entries = result.scalars().all()
        assert len(history_entries) == 1
        assert history_entries[0].action == "CREATED"
        assert history_entries[0].from_status is None
        assert history_entries[0].to_status == "Aberto"
        assert history_entries[0].analyst_name == "Sistema"
