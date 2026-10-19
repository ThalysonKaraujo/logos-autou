from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


class IncidentCategory(str, Enum):
    ACIDENTE_VEICULO = "Acidente com Veículo"
    ACIDENTE_VITIMAS = "Acidente com Vítimas"
    CLIMA_ATIPICO = "Condição Climática Atípica na Pista"
    PROBLEMA_MECANICO = "Problema Mecânico"
    BLOQUEIO_PISTA = "Bloqueio de Pista"


class IncidentCriticality(str, Enum):
    ALTA = "Alta"
    MEDIA = "Média"
    BAIXA = "Baixa"


class IncidentStatus(str, Enum):
    ABERTO = "Aberto"
    EM_INVESTIGACAO = "Em Investigação"
    FECHADO = "Fechado"
    INCONCLUSIVO = "Inconclusivo"


class IncidentBase(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5)
    category: IncidentCategory
    criticality: IncidentCriticality
    location: str = Field(min_length=3, max_length=120)
    truck_plate: str = Field(min_length=7, max_length=10)
    driver_name: str | None = Field(default=None, max_length=100)


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(IncidentBase):
    expected_version: int = Field(
        ge=1,
        validation_alias=AliasChoices("expected_version", "version"),
    )
    analyst_name: str = Field(min_length=2, max_length=100)
    notes: str | None = Field(default=None, max_length=500)


class IncidentStatusUpdate(BaseModel):
    status: IncidentStatus
    expected_version: int = Field(
        ge=1,
        validation_alias=AliasChoices("expected_version", "version"),
    )
    analyst_name: str = Field(min_length=2, max_length=100)
    notes: str | None = Field(default=None, max_length=500)


class IncidentHistoryResponse(BaseModel):
    id: UUID
    incident_id: UUID
    analyst_name: str
    action: str
    from_status: str | None
    to_status: str | None
    notes: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentResponse(IncidentBase):
    id: UUID
    status: IncidentStatus
    assigned_to: str | None
    version: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IncidentDetailResponse(IncidentResponse):
    history: list[IncidentHistoryResponse] = []


class IncidentListResponse(BaseModel):
    items: list[IncidentResponse]
    total: int
