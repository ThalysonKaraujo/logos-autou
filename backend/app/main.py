import logging
import time
import uuid
from collections.abc import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.rate_limit import get_client_ip, rate_limiter

logger = logging.getLogger("uvicorn.access")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API de Gestão de Incidentes em Tempo Real para Operações Logísticas com Controle de Concorrência Otimista (OCC)",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

register_exception_handlers(app)

EXEMPT_RATE_LIMIT_PATHS = {
    "/",
    "/docs",
    "/redoc",
    "/openapi.json",
    f"{settings.API_V1_STR}/openapi.json",
    f"{settings.API_V1_STR}/health",
}


@app.middleware("http")
async def rate_limit_middleware(
    request: Request,
    call_next: Callable[[Request], Response],
) -> Response:
    if not settings.RATE_LIMIT_ENABLED or request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path in EXEMPT_RATE_LIMIT_PATHS:
        return await call_next(request)

    client_ip = get_client_ip(request)
    allowed, remaining, retry_after, reset_ts = rate_limiter.check_rate_limit(client_ip)

    if not allowed:
        return Response(
            status_code=429,
            media_type="application/json",
            headers={
                "X-RateLimit-Limit": str(rate_limiter.max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_ts),
                "Retry-After": str(retry_after),
            },
            content=(
                '{"status_code":429,'
                '"status_name":"Too Many Requests",'
                '"message":"Taxa limite de requisições excedida. Tente novamente em alguns segundos.",'
                f'"details":{{"limit":{rate_limiter.max_requests},"window_seconds":{rate_limiter.window_seconds},"retry_after":{retry_after}}}}}'
            ),
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_ts)
    return response


@app.middleware("http")
async def request_context_middleware(
    request: Request,
    call_next: Callable[[Request], Response],
) -> Response:
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time_ms:.2f}ms"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({process_time_ms:.2f}ms)"
    )

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_origin_regex=settings.BACKEND_CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Request-ID",
        "X-Process-Time",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
        "Retry-After",
    ],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", include_in_schema=False)
async def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")
