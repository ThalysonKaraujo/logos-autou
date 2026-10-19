import time
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.rate_limit import SlidingWindowRateLimiter, rate_limiter
from app.main import app


@pytest.fixture(autouse=True)
def reset_limiter():
    rate_limiter.reset()
    yield
    rate_limiter.reset()


def test_sliding_window_rate_limiter_allows_under_limit():
    limiter = SlidingWindowRateLimiter(max_requests=5, window_seconds=60)
    client_ip = "192.168.1.1"

    for i in range(5):
        allowed, remaining, retry_after, reset_ts = limiter.check_rate_limit(client_ip)
        assert allowed is True
        assert remaining == 4 - i
        assert retry_after == 0
        assert reset_ts > 0


def test_sliding_window_rate_limiter_blocks_over_limit():
    limiter = SlidingWindowRateLimiter(max_requests=3, window_seconds=60)
    client_ip = "192.168.1.2"

    for _ in range(3):
        allowed, _, _, _ = limiter.check_rate_limit(client_ip)
        assert allowed is True

    allowed, remaining, retry_after, reset_ts = limiter.check_rate_limit(client_ip)
    assert allowed is False
    assert remaining == 0
    assert retry_after > 0
    assert reset_ts > 0


def test_sliding_window_evicts_expired_entries():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=1)
    client_ip = "192.168.1.3"

    allowed, _, _, _ = limiter.check_rate_limit(client_ip)
    assert allowed is True

    allowed, _, _, _ = limiter.check_rate_limit(client_ip)
    assert allowed is True

    allowed, _, _, _ = limiter.check_rate_limit(client_ip)
    assert allowed is False

    time.sleep(1.05)

    allowed, remaining, _, _ = limiter.check_rate_limit(client_ip)
    assert allowed is True
    assert remaining == 1


def test_sliding_window_tracks_ips_independently():
    limiter = SlidingWindowRateLimiter(max_requests=2, window_seconds=60)

    for _ in range(2):
        assert limiter.check_rate_limit("10.0.0.1")[0] is True

    assert limiter.check_rate_limit("10.0.0.1")[0] is False
    assert limiter.check_rate_limit("10.0.0.2")[0] is True


@pytest.mark.asyncio
async def test_endpoint_returns_rate_limit_headers():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/incidents")

    assert response.status_code == 200
    assert "x-ratelimit-limit" in response.headers
    assert "x-ratelimit-remaining" in response.headers
    assert "x-ratelimit-reset" in response.headers
    assert int(response.headers["x-ratelimit-limit"]) == settings.RATE_LIMIT_PER_MINUTE


@pytest.mark.asyncio
async def test_exempt_endpoints_do_not_have_rate_limiting():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert "x-ratelimit-limit" not in response.headers


@pytest.mark.asyncio
async def test_exceeding_rate_limit_returns_429():
    transport = ASGITransport(app=app)

    with patch.object(settings, "RATE_LIMIT_PER_MINUTE", 3):
        rate_limiter.max_requests = 3
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"X-Forwarded-For": "203.0.113.195"},
        ) as client:
            for _ in range(3):
                res = await client.get("/api/v1/incidents")
                assert res.status_code == 200

            res = await client.get("/api/v1/incidents")
            assert res.status_code == 429
            assert res.headers.get("retry-after") is not None
            assert res.headers.get("x-ratelimit-remaining") == "0"

            data = res.json()
            assert data["status_code"] == 429
            assert data["status_name"] == "Too Many Requests"
            assert "Taxa limite" in data["message"]
            assert data["details"]["limit"] == 3


@pytest.mark.asyncio
async def test_rate_limiting_disabled_via_settings():
    transport = ASGITransport(app=app)

    with (
        patch.object(settings, "RATE_LIMIT_ENABLED", False),
        patch.object(settings, "RATE_LIMIT_PER_MINUTE", 1),
    ):
        rate_limiter.max_requests = 1
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"X-Forwarded-For": "198.51.100.42"},
        ) as client:
            res1 = await client.get("/api/v1/incidents")
            res2 = await client.get("/api/v1/incidents")

            assert res1.status_code == 200
            assert res2.status_code == 200
            assert "x-ratelimit-limit" not in res1.headers


@pytest.mark.asyncio
async def test_x_forwarded_for_multiple_ips_uses_first():
    transport = ASGITransport(app=app)

    with patch.object(settings, "RATE_LIMIT_PER_MINUTE", 2):
        rate_limiter.max_requests = 2
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            headers={"X-Forwarded-For": "198.51.100.99, 10.0.0.1, 10.0.0.2"},
        ) as client:
            res1 = await client.get("/api/v1/incidents")
            res2 = await client.get("/api/v1/incidents")
            res3 = await client.get("/api/v1/incidents")

            assert res1.status_code == 200
            assert res2.status_code == 200
            assert res3.status_code == 429
