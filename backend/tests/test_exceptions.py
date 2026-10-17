import pytest
from fastapi import APIRouter, HTTPException
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel, Field

from app.main import app

dummy_router = APIRouter()


class SamplePayload(BaseModel):
    title: str = Field(min_length=3)


@dummy_router.get("/trigger-404")
async def trigger_not_found():
    raise HTTPException(status_code=404, detail="Incidente não encontrado")


@dummy_router.get("/trigger-409")
async def trigger_conflict():
    raise HTTPException(status_code=409, detail="Conflito de versão detectado")


@dummy_router.post("/trigger-validation")
async def trigger_validation(payload: SamplePayload):
    return {"title": payload.title}


app.include_router(dummy_router, prefix="/api/v1/test-suite")


@pytest.mark.asyncio
async def test_not_found_error_structure():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/test-suite/trigger-404")

    assert response.status_code == 404
    data = response.json()
    assert data["status_code"] == 404
    assert data["status_name"] == "Not Found"
    assert data["message"] == "Incidente não encontrado"
    assert data["details"] is None


@pytest.mark.asyncio
async def test_conflict_error_structure():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/test-suite/trigger-409")

    assert response.status_code == 409
    data = response.json()
    assert data["status_code"] == 409
    assert data["status_name"] == "Conflict"
    assert data["message"] == "Conflito de versão detectado"
    assert data["details"] is None


@pytest.mark.asyncio
async def test_validation_error_structure():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/test-suite/trigger-validation", json={"title": "a"}
        )

    assert response.status_code == 422
    data = response.json()
    assert data["status_code"] == 422
    assert data["status_name"] == "Unprocessable Entity"
    assert data["message"] == "Erro de validação nos dados enviados"
    assert isinstance(data["details"], list)
    assert len(data["details"]) > 0


@pytest.mark.asyncio
async def test_route_not_found_default_structure():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/non-existent-endpoint")

    assert response.status_code == 404
    data = response.json()
    assert data["status_code"] == 404
    assert data["status_name"] == "Not Found"
    assert data["message"] == "Not Found"
    assert data["details"] is None
