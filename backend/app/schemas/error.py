from typing import Any

from pydantic import BaseModel


class ErrorResponse(BaseModel):
    status_code: int
    status_name: str
    message: str
    details: Any = None
