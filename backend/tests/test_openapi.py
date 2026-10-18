import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_openapi_schema_contains_error_response_definition():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    schemas = schema.get("components", {}).get("schemas", {})
    assert "ErrorResponse" in schemas


@pytest.mark.asyncio
async def test_openapi_documents_incident_endpoints_error_responses():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    paths = response.json().get("paths", {})

    post_responses = paths["/api/v1/incidents"]["post"]["responses"]
    assert "400" in post_responses
    post_400_ref = post_responses["400"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    assert post_400_ref == "#/components/schemas/ErrorResponse"

    get_id_responses = paths["/api/v1/incidents/{incident_id}"]["get"]["responses"]
    assert "404" in get_id_responses
    get_404_ref = get_id_responses["404"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    assert get_404_ref == "#/components/schemas/ErrorResponse"

    patch_responses = paths["/api/v1/incidents/{incident_id}/status"]["patch"][
        "responses"
    ]
    assert "400" in patch_responses
    assert "404" in patch_responses
    assert "409" in patch_responses

    patch_400_ref = patch_responses["400"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    patch_404_ref = patch_responses["404"]["content"]["application/json"]["schema"][
        "$ref"
    ]
    patch_409_ref = patch_responses["409"]["content"]["application/json"]["schema"][
        "$ref"
    ]

    assert patch_400_ref == "#/components/schemas/ErrorResponse"
    assert patch_404_ref == "#/components/schemas/ErrorResponse"
    assert patch_409_ref == "#/components/schemas/ErrorResponse"
