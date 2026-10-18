import http
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def get_status_name(status_code: int) -> str:
    try:
        return http.HTTPStatus(status_code).phrase
    except ValueError:
        return "Unknown Status"


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    message = str(exc.detail) if exc.detail else get_status_name(exc.status_code)
    details: Any = None

    if isinstance(exc.detail, dict):
        message = exc.detail.get("message", get_status_name(exc.status_code))
        details = exc.detail.get("details", None)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "status_name": get_status_name(exc.status_code),
            "message": message,
            "details": details,
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    return JSONResponse(
        status_code=status_code,
        content={
            "status_code": status_code,
            "status_name": get_status_name(status_code),
            "message": "Erro de validação nos dados enviados",
            "details": jsonable_encoder(exc.errors()),
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
