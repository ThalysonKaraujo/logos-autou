from datetime import UTC, datetime
from uuid import UUID

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, update

from app.core.database import AsyncSessionLocal
from app.main import app
from app.models.incident import Incident, IncidentHistory


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


@pytest.mark.asyncio
async def test_update_incident_status_fails_with_invalid_payload():
    incident_id = "00000000-0000-0000-0000-000000000000"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Status Invalido",
                "expected_version": 0,
                "analyst_name": "A",
            },
        )

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"
    assert data["message"] == "Erro de validação nos dados enviados"


@pytest.mark.asyncio
async def test_update_incident_status_fails_when_not_found():
    non_existent_id = "00000000-0000-0000-0000-000000000000"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.patch(
            f"/api/v1/incidents/{non_existent_id}/status",
            json={
                "status": "Em Investigação",
                "expected_version": 1,
                "analyst_name": "Mariana Silva",
                "notes": "Iniciando atendimento",
            },
        )

    assert response.status_code == 404
    data = response.json()
    assert data["status_code"] == 404
    assert data["status_name"] == "Not Found"
    assert data["message"] == "Incidente não encontrado"


@pytest.mark.asyncio
async def test_update_incident_status_fails_when_same_status():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/incidents", json=get_valid_incident_payload()
        )
        incident_id = create_response.json()["id"]

        response = await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Aberto",
                "expected_version": 1,
                "analyst_name": "Mariana Silva",
            },
        )

    assert response.status_code == 400
    data = response.json()
    assert data["status_code"] == 400
    assert data["status_name"] == "Bad Request"
    assert data["message"] == "O incidente já se encontra neste status"


@pytest.mark.asyncio
async def test_update_incident_status_fails_on_stale_version_conflict():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/incidents", json=get_valid_incident_payload()
        )
        incident_id = create_response.json()["id"]

        first_update = await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Em Investigação",
                "expected_version": 1,
                "analyst_name": "Mariana Silva",
                "notes": "Assumindo ocorrência",
            },
        )
        assert first_update.status_code == 200
        assert first_update.json()["version"] == 2

        conflicting_update = await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Fechado",
                "expected_version": 1,
                "analyst_name": "Carlos Mendes",
                "notes": "Tentativa com versão antiga",
            },
        )

        assert conflicting_update.status_code == 409
        conflict_data = conflicting_update.json()
        assert conflict_data["status_code"] == 409
        assert conflict_data["status_name"] == "Conflict"
        assert (
            conflict_data["message"]
            == "Conflito de versão: este incidente já foi atualizado por outro operador"
        )

        current_state = await client.get(f"/api/v1/incidents/{incident_id}")
        current_data = current_state.json()
        assert current_data["status"] == "Em Investigação"
        assert current_data["assigned_to"] == "Mariana Silva"
        assert current_data["version"] == 2
        assert len(current_data["history"]) == 2


@pytest.mark.asyncio
async def test_update_incident_status_succeeds_and_appends_history():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/incidents", json=get_valid_incident_payload()
        )
        incident_id = create_response.json()["id"]

        step_1 = await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Em Investigação",
                "expected_version": 1,
                "analyst_name": "Mariana Silva",
                "notes": "Acionando equipe de apoio na rodovia",
            },
        )
        assert step_1.status_code == 200
        data_1 = step_1.json()
        assert data_1["status"] == "Em Investigação"
        assert data_1["assigned_to"] == "Mariana Silva"
        assert data_1["version"] == 2
        assert len(data_1["history"]) == 2

        step_2 = await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Fechado",
                "expected_version": 2,
                "analyst_name": "Carlos Mendes",
                "notes": "Veículo removido e pista liberada",
            },
        )
        assert step_2.status_code == 200
        data_2 = step_2.json()
        assert data_2["status"] == "Fechado"
        assert data_2["assigned_to"] == "Carlos Mendes"
        assert data_2["version"] == 3
        assert len(data_2["history"]) == 3

        history = data_2["history"]
        assert history[0]["action"] == "CREATED"
        assert history[0]["to_status"] == "Aberto"

        assert history[1]["action"] == "STATUS_CHANGED"
        assert history[1]["from_status"] == "Aberto"
        assert history[1]["to_status"] == "Em Investigação"
        assert history[1]["analyst_name"] == "Mariana Silva"
        assert history[1]["notes"] == "Acionando equipe de apoio na rodovia"

        assert history[2]["action"] == "STATUS_CHANGED"
        assert history[2]["from_status"] == "Em Investigação"
        assert history[2]["to_status"] == "Fechado"
        assert history[2]["analyst_name"] == "Carlos Mendes"
        assert history[2]["notes"] == "Veículo removido e pista liberada"


@pytest.mark.asyncio
async def test_update_incident_succeeds_and_records_audit_diff():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/incidents", json=get_valid_incident_payload()
        )
        incident_id = create_response.json()["id"]

        update_payload = {
            **get_valid_incident_payload(),
            "criticality": "Média",
            "location": "Rodovia Presidente Dutra, Km 185",
            "expected_version": 1,
            "analyst_name": "Mariana Silva",
            "notes": "Confirmado pela PRF no local",
        }

        update_response = await client.put(
            f"/api/v1/incidents/{incident_id}",
            json=update_payload,
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["criticality"] == "Média"
        assert data["location"] == "Rodovia Presidente Dutra, Km 185"
        assert data["assigned_to"] == "Mariana Silva"
        assert data["version"] == 2
        assert len(data["history"]) == 2
        assert data["history"][1]["action"] == "UPDATED"
        assert data["history"][1]["analyst_name"] == "Mariana Silva"
        assert "Criticidade (Alta → Média)" in data["history"][1]["notes"]
        assert "Localização" in data["history"][1]["notes"]
        assert "Confirmado pela PRF no local" in data["history"][1]["notes"]


@pytest.mark.asyncio
async def test_update_incident_returns_409_on_version_conflict():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/incidents", json=get_valid_incident_payload()
        )
        incident_id = create_response.json()["id"]

        await client.patch(
            f"/api/v1/incidents/{incident_id}/status",
            json={
                "status": "Em Investigação",
                "expected_version": 1,
                "analyst_name": "Mariana Silva",
            },
        )

        conflict_response = await client.put(
            f"/api/v1/incidents/{incident_id}",
            json={
                **get_valid_incident_payload(),
                "criticality": "Baixa",
                "expected_version": 1,
                "analyst_name": "Carlos Mendes",
            },
        )
        assert conflict_response.status_code == 409


@pytest.mark.asyncio
async def test_update_incident_returns_400_when_no_changes():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/incidents", json=get_valid_incident_payload()
        )
        incident_id = create_response.json()["id"]

        no_change_response = await client.put(
            f"/api/v1/incidents/{incident_id}",
            json={
                **get_valid_incident_payload(),
                "expected_version": 1,
                "analyst_name": "Mariana Silva",
            },
        )
        assert no_change_response.status_code == 400


@pytest.mark.asyncio
async def test_list_incidents_with_date_range_and_priority_filters():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        p1 = get_valid_incident_payload()
        p1["title"] = "Incidente Antigo Alta"
        p1["criticality"] = "Alta"
        p1["truck_plate"] = "OLD1A11"
        r1 = await client.post("/api/v1/incidents", json=p1)
        id_1 = UUID(r1.json()["id"])

        p2 = get_valid_incident_payload()
        p2["title"] = "Incidente Período Alta"
        p2["criticality"] = "Alta"
        p2["truck_plate"] = "MID2B22"
        r2 = await client.post("/api/v1/incidents", json=p2)
        id_2 = UUID(r2.json()["id"])

        p3 = get_valid_incident_payload()
        p3["title"] = "Incidente Período Baixa"
        p3["criticality"] = "Baixa"
        p3["truck_plate"] = "MID3C33"
        r3 = await client.post("/api/v1/incidents", json=p3)
        id_3 = UUID(r3.json()["id"])

        p4 = get_valid_incident_payload()
        p4["title"] = "Incidente Recente Alta"
        p4["criticality"] = "Alta"
        p4["truck_plate"] = "NEW4D44"
        r4 = await client.post("/api/v1/incidents", json=p4)
        id_4 = UUID(r4.json()["id"])

        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Incident)
                .where(Incident.id == id_1)
                .values(created_at=datetime(2026, 10, 1, 10, 0, tzinfo=UTC))
            )
            await session.execute(
                update(Incident)
                .where(Incident.id == id_2)
                .values(created_at=datetime(2026, 10, 10, 14, 30, tzinfo=UTC))
            )
            await session.execute(
                update(Incident)
                .where(Incident.id == id_3)
                .values(created_at=datetime(2026, 10, 10, 18, 0, tzinfo=UTC))
            )
            await session.execute(
                update(Incident)
                .where(Incident.id == id_4)
                .values(created_at=datetime(2026, 10, 20, 9, 0, tzinfo=UTC))
            )
            await session.commit()

        res_date_only = await client.get(
            "/api/v1/incidents?date_from=2026-10-05&date_to=2026-10-15"
        )
        assert res_date_only.status_code == 200
        data_date_only = res_date_only.json()
        assert data_date_only["total"] == 2

        res_combined = await client.get(
            "/api/v1/incidents?date_from=2026-10-05&date_to=2026-10-15&criticality=Alta"
        )
        assert res_combined.status_code == 200
        data_combined = res_combined.json()
        assert data_combined["total"] == 1
        assert data_combined["items"][0]["title"] == "Incidente Período Alta"


@pytest.mark.asyncio
async def test_list_incidents_search_by_location():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = get_valid_incident_payload()
        payload["title"] = "Falha no freio"
        payload["location"] = "Rodovia Fernão Dias, Km 45"
        await client.post("/api/v1/incidents", json=payload)

        response = await client.get("/api/v1/incidents?search=Fernão Dias")

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["location"] == "Rodovia Fernão Dias, Km 45"


@pytest.mark.asyncio
async def test_create_incident_with_custom_date():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = get_valid_incident_payload()
        payload["title"] = "Incidente Retroativo"
        payload["created_at"] = "2026-10-12"
        create_res = await client.post("/api/v1/incidents", json=payload)

        assert create_res.status_code == 201
        created_data = create_res.json()
        assert created_data["created_at"].startswith("2026-10-12")

        filter_res = await client.get(
            "/api/v1/incidents?date_from=2026-10-12&date_to=2026-10-12"
        )
        assert filter_res.status_code == 200
        assert filter_res.json()["total"] == 1
        assert filter_res.json()["items"][0]["title"] == "Incidente Retroativo"


@pytest.mark.asyncio
async def test_list_incidents_sorted_by_criticality_asc():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        p_alta = get_valid_incident_payload()
        p_alta["title"] = "Incidente Alta"
        p_alta["criticality"] = "Alta"
        p_alta["truck_plate"] = "ALT1111"
        await client.post("/api/v1/incidents", json=p_alta)

        p_baixa = get_valid_incident_payload()
        p_baixa["title"] = "Incidente Baixa"
        p_baixa["criticality"] = "Baixa"
        p_baixa["truck_plate"] = "BAX1111"
        await client.post("/api/v1/incidents", json=p_baixa)

        p_media = get_valid_incident_payload()
        p_media["title"] = "Incidente Média"
        p_media["criticality"] = "Média"
        p_media["truck_plate"] = "MED1111"
        await client.post("/api/v1/incidents", json=p_media)

        res = await client.get("/api/v1/incidents?sort_by=criticality_asc")
        assert res.status_code == 200
        items = res.json()["items"]
        assert len(items) == 3
        assert items[0]["criticality"] == "Baixa"
        assert items[1]["criticality"] == "Média"
        assert items[2]["criticality"] == "Alta"


@pytest.mark.asyncio
async def test_list_incidents_sorted_by_created_at_desc_and_asc():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        p1 = get_valid_incident_payload()
        p1["title"] = "Primeiro Criado"
        p1["criticality"] = "Alta"
        p1["truck_plate"] = "AAA1111"
        p1["created_at"] = "2026-10-01"
        await client.post("/api/v1/incidents", json=p1)

        p2 = get_valid_incident_payload()
        p2["title"] = "Segundo Criado"
        p2["criticality"] = "Baixa"
        p2["truck_plate"] = "BBB2222"
        p2["created_at"] = "2026-10-15"
        await client.post("/api/v1/incidents", json=p2)

        res_desc = await client.get("/api/v1/incidents?sort_by=created_at_desc")
        assert res_desc.status_code == 200
        items_desc = res_desc.json()["items"]
        assert items_desc[0]["title"] == "Segundo Criado"
        assert items_desc[1]["title"] == "Primeiro Criado"

        res_asc = await client.get("/api/v1/incidents?sort_by=created_at_asc")
        assert res_asc.status_code == 200
        items_asc = res_asc.json()["items"]
        assert items_asc[0]["title"] == "Primeiro Criado"
        assert items_asc[1]["title"] == "Segundo Criado"


@pytest.mark.asyncio
async def test_list_incidents_sorted_by_updated_at_desc():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        p1 = get_valid_incident_payload()
        p1["title"] = "Chamado Sem Atualizacao"
        p1["truck_plate"] = "SEM1111"
        await client.post("/api/v1/incidents", json=p1)

        p2 = get_valid_incident_payload()
        p2["title"] = "Chamado Com Atualizacao"
        p2["truck_plate"] = "COM2222"
        r2 = await client.post("/api/v1/incidents", json=p2)
        id_2 = r2.json()["id"]

        await client.patch(
            f"/api/v1/incidents/{id_2}/status",
            json={
                "status": "Em Investigação",
                "expected_version": 1,
                "analyst_name": "Carlos Mendes",
            },
        )

        res = await client.get("/api/v1/incidents?sort_by=updated_at_desc")
        assert res.status_code == 200
        items = res.json()["items"]
        assert items[0]["title"] == "Chamado Com Atualizacao"


@pytest.mark.asyncio
async def test_list_incidents_fails_with_invalid_sort_by():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/incidents?sort_by=invalid_sort")
        assert res.status_code == 422

