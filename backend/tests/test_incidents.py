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


@pytest.mark.asyncio
async def test_get_incident_by_id_fails_with_invalid_uuid():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/incidents/id-invalido")

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"
    assert data["message"] == "Erro de validação nos dados enviados"
    assert isinstance(data["details"], list)


@pytest.mark.asyncio
async def test_get_incident_by_id_fails_when_not_found():
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get(f"/api/v1/incidents/{non_existent_id}")

    assert response.status_code == 404
    data = response.json()
    assert data["status_code"] == 404
    assert data["status_name"] == "Not Found"
    assert data["message"] == "Incidente não encontrado"
    assert data["details"] is None


@pytest.mark.asyncio
async def test_get_incident_by_id_succeeds_with_history():
    payload = get_valid_incident_payload()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post("/api/v1/incidents", json=payload)
        incident_id = create_response.json()["id"]

        response = await client.get(f"/api/v1/incidents/{incident_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == incident_id
    assert data["title"] == payload["title"]
    assert data["status"] == "Aberto"
    assert data["version"] == 1
    assert isinstance(data["history"], list)
    assert len(data["history"]) == 1
    assert data["history"][0]["action"] == "CREATED"
    assert data["history"][0]["from_status"] is None
    assert data["history"][0]["to_status"] == "Aberto"
    assert data["history"][0]["analyst_name"] == "Sistema"


@pytest.mark.asyncio
async def test_list_incidents_fails_with_invalid_pagination():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response_zero_limit = await client.get("/api/v1/incidents?limit=0")
        response_high_limit = await client.get("/api/v1/incidents?limit=101")
        response_neg_skip = await client.get("/api/v1/incidents?skip=-1")

    assert response_zero_limit.status_code == 422
    assert response_high_limit.status_code == 422
    assert response_neg_skip.status_code == 422


@pytest.mark.asyncio
async def test_list_incidents_fails_with_invalid_criticality_filter():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/incidents?criticality=Inexistente")

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"


@pytest.mark.asyncio
async def test_list_incidents_empty():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/incidents")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_incidents_with_pagination():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        for index in range(3):
            payload = get_valid_incident_payload()
            payload["title"] = f"Incidente {index + 1}"
            payload["truck_plate"] = f"ABC{index}D12"
            await client.post("/api/v1/incidents", json=payload)

        response = await client.get("/api/v1/incidents?skip=0&limit=2")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 2
    assert data["total"] == 3


@pytest.mark.asyncio
async def test_list_incidents_with_filters():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload_1 = get_valid_incident_payload()
        payload_1["title"] = "Bloqueio na pista norte"
        payload_1["category"] = "Bloqueio de Pista"
        payload_1["criticality"] = "Alta"
        await client.post("/api/v1/incidents", json=payload_1)

        payload_2 = get_valid_incident_payload()
        payload_2["title"] = "Pane eletrica leve"
        payload_2["category"] = "Problema Mecânico"
        payload_2["criticality"] = "Baixa"
        payload_2["truck_plate"] = "XYZ9K88"
        await client.post("/api/v1/incidents", json=payload_2)

        response = await client.get(
            "/api/v1/incidents?category=Bloqueio de Pista&criticality=Alta"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["title"] == "Bloqueio na pista norte"
    assert data["items"][0]["category"] == "Bloqueio de Pista"
    assert data["items"][0]["criticality"] == "Alta"


@pytest.mark.asyncio
async def test_list_incidents_search_by_plate_or_title():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = get_valid_incident_payload()
        payload["title"] = "Superaquecimento grave"
        payload["truck_plate"] = "SCO9988"
        await client.post("/api/v1/incidents", json=payload)

        response_plate = await client.get("/api/v1/incidents?search=SCO9988")
        response_title = await client.get("/api/v1/incidents?search=Superaquecimento")

    assert response_plate.status_code == 200
    assert response_plate.json()["total"] == 1
    assert response_plate.json()["items"][0]["truck_plate"] == "SCO9988"

    assert response_title.status_code == 200
    assert response_title.json()["total"] == 1


@pytest.mark.asyncio
async def test_list_incidents_ordered_by_triage_priority():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload_low = get_valid_incident_payload()
        payload_low["title"] = "Pneu furado no acostamento"
        payload_low["criticality"] = "Baixa"
        payload_low["truck_plate"] = "BAX1111"
        await client.post("/api/v1/incidents", json=payload_low)

        payload_high = get_valid_incident_payload()
        payload_high["title"] = "Tombamento com vítimas"
        payload_high["criticality"] = "Alta"
        payload_high["truck_plate"] = "ALT2222"
        await client.post("/api/v1/incidents", json=payload_high)

        payload_medium = get_valid_incident_payload()
        payload_medium["title"] = "Pane mecânica em faixa 2"
        payload_medium["criticality"] = "Média"
        payload_medium["truck_plate"] = "MED3333"
        await client.post("/api/v1/incidents", json=payload_medium)

        response = await client.get("/api/v1/incidents")

    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 3
    assert items[0]["criticality"] == "Alta"
    assert items[1]["criticality"] == "Média"
    assert items[2]["criticality"] == "Baixa"
