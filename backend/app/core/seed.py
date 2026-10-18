import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine
from app.models.incident import Incident, IncidentHistory
from app.schemas.incident import (
    IncidentCategory,
    IncidentCriticality,
    IncidentStatus,
)

CATEGORY_TEMPLATES: dict[IncidentCategory, list[tuple[str, str]]] = {
    IncidentCategory.ACIDENTE_VEICULO: [
        (
            "Tombamento parcial de semirreboque na faixa direita",
            "Carreta tombou no acostamento após desvio brusco, sem feridos, exigindo guincho pesado.",
        ),
        (
            "Colisão traseira entre carretas em trecho de serra",
            "Impacto em baixa velocidade danificou o para-choque e o radiador do cavalo mecânico.",
        ),
        (
            "Saída de pista após frenagem de emergência",
            "Veículo imobilizado na área de escape após falha de aderência em pista molhada.",
        ),
        (
            "Abalroamento lateral em acesso de pedágio",
            "Danos na lateral da carroceria baú durante manobra de entrada na praça de pedágio.",
        ),
    ],
    IncidentCategory.ACIDENTE_VITIMAS: [
        (
            "Colisão com acionamento de resgate médico na rodovia",
            "Unidade de resgate da concessionária no local prestando atendimento ao condutor.",
        ),
        (
            "Capotamento em curva acentuada com motorista ferido",
            "Equipe médica acionada imediatamente e pista sinalizada pela Polícia Rodoviária Federal.",
        ),
        (
            "Engavetamento múltiplo com atendimento de ambulância",
            "Três veículos envolvidos, motorista consciente encaminhado para avaliação hospitalar.",
        ),
    ],
    IncidentCategory.CLIMA_ATIPICO: [
        (
            "Neblina densa com visibilidade inferior a 20 metros",
            "Comboio reduzindo velocidade para 30 km/h no topo da serra por segurança operacional.",
        ),
        (
            "Alagamento severo bloqueando passagem de veículos pesados",
            "Nível da água subiu na baixada impedindo avanço seguro da frota no sentido sul.",
        ),
        (
            "Tempestade de granizo e ventos fortes na rodovia",
            "Motorista realizou parada preventiva em posto credenciado aguardando melhora climática.",
        ),
    ],
    IncidentCategory.PROBLEMA_MECANICO: [
        (
            "Superaquecimento crítico no motor diesel",
            "Temperatura do líquido de arrefecimento subiu acima do limite em subida de serra.",
        ),
        (
            "Falha no sistema pneumático de freios da carreta",
            "Perda de pressão na linha de ar obrigou parada imediata no acostamento sinalizado.",
        ),
        (
            "Rompimento de mangueira hidráulica da direção",
            "Vazamento de fluido hidráulico identificado pelo motorista durante inspeção de parada.",
        ),
        (
            "Pane elétrica no módulo de injeção eletrônica",
            "Painel acusou falha de comunicação no chicote principal e perda de potência.",
        ),
    ],
    IncidentCategory.BLOQUEIO_PISTA: [
        (
            "Interdição total por manifestação na rodovia",
            "Ambos os sentidos bloqueados sem previsão imediata de liberação pela concessionária.",
        ),
        (
            "Pista bloqueada por queda de barreira no trecho de serra",
            "Equipes de engenharia trabalhando na remoção de terra e rochas na pista principal.",
        ),
        (
            "Interdição pela PRF para remoção de carga perigosa",
            "Tráfego desviado para rota alternativa secundária com lentidão de 12 km.",
        ),
    ],
}

LOCATIONS: list[str] = [
    "BR-116, Km 340 - Registro/SP",
    "BR-101, Km 210 - Palhoça/SC",
    "BR-381, Km 480 - Betim/MG",
    "Rod. Presidente Dutra, Km 165 - Jacareí/SP",
    "BR-153, Km 92 - Anápolis/GO",
    "Rod. Anhanguera, Km 110 - Campinas/SP",
    "BR-277, Km 42 - Morretes/PR",
    "BR-040, Km 615 - Congonhas/MG",
    "BR-101, Km 85 - Campos dos Goytacazes/RJ",
    "Rod. Bandeirantes, Km 72 - Jundiaí/SP",
]

DRIVERS: list[str] = [
    "Marcos Oliveira",
    "Roberto Santos",
    "Cláudio Ferreira",
    "Antônio Pereira",
    "José Carlos Souza",
    "Paulo Henrique Lima",
    "Ricardo Almeida",
    "Fernando Costa",
    "Valdir Nascimento",
    "Sérgio Ribeiro",
]

ANALYSTS: list[str] = [
    "Mariana Silva",
    "Carlos Mendes",
    "Fernanda Costa",
    "Rafael Souza",
]


async def seed_incidents(
    db: AsyncSession, count: int = 100, reset: bool = False
) -> int:
    if count <= 0:
        raise ValueError("count must be greater than zero")

    if reset:
        await db.execute(delete(Incident))
        await db.flush()
    else:
        existing_result = await db.execute(select(func.count(Incident.id)))
        if existing_result.scalar_one() > 0:
            return 0

    categories = list(IncidentCategory)
    criticalities = list(IncidentCriticality)
    statuses = list(IncidentStatus)
    base_time = datetime.now(UTC)

    for index in range(count):
        category = categories[index % len(categories)]
        criticality = criticalities[index % len(criticalities)]
        target_status = statuses[index % len(statuses)]

        templates = CATEGORY_TEMPLATES[category]
        title_base, description = templates[index % len(templates)]
        location = LOCATIONS[index % len(LOCATIONS)]
        driver_name = DRIVERS[index % len(DRIVERS)]
        analyst_name = ANALYSTS[index % len(ANALYSTS)]
        truck_plate = f"LOG{index % 10}{chr(65 + (index % 26))}{10 + (index % 89)}"

        created_at = base_time - timedelta(minutes=(count - index) * 7)
        incident_id = uuid.uuid4()

        if target_status == IncidentStatus.ABERTO:
            version = 1
            assigned_to = None
            updated_at = created_at
        elif target_status == IncidentStatus.EM_INVESTIGACAO:
            version = 2
            assigned_to = analyst_name
            updated_at = created_at + timedelta(minutes=3)
        else:
            version = 3
            assigned_to = analyst_name
            updated_at = created_at + timedelta(minutes=18)

        incident = Incident(
            id=incident_id,
            title=title_base,
            description=description,
            category=category.value,
            criticality=criticality.value,
            status=target_status.value,
            location=location,
            truck_plate=truck_plate,
            driver_name=driver_name,
            assigned_to=assigned_to,
            version=version,
            created_at=created_at,
            updated_at=updated_at,
        )
        db.add(incident)

        db.add(
            IncidentHistory(
                incident_id=incident_id,
                analyst_name="Sistema",
                action="CREATED",
                from_status=None,
                to_status=IncidentStatus.ABERTO.value,
                notes="Incidente registrado via telemetria da frota",
                created_at=created_at,
            )
        )

        if target_status in (
            IncidentStatus.EM_INVESTIGACAO,
            IncidentStatus.FECHADO,
            IncidentStatus.INCONCLUSIVO,
        ):
            db.add(
                IncidentHistory(
                    incident_id=incident_id,
                    analyst_name=analyst_name,
                    action="STATUS_CHANGED",
                    from_status=IncidentStatus.ABERTO.value,
                    to_status=IncidentStatus.EM_INVESTIGACAO.value,
                    notes="Operador assumiu a ocorrência e acionou suporte na rodovia",
                    created_at=created_at + timedelta(minutes=3),
                )
            )

        if target_status in (IncidentStatus.FECHADO, IncidentStatus.INCONCLUSIVO):
            closing_note = (
                "Atendimento concluído e veículo liberado para seguir viagem"
                if target_status == IncidentStatus.FECHADO
                else "Sinal de telemetria restabelecido sem confirmação de anomalia física"
            )
            db.add(
                IncidentHistory(
                    incident_id=incident_id,
                    analyst_name=analyst_name,
                    action="STATUS_CHANGED",
                    from_status=IncidentStatus.EM_INVESTIGACAO.value,
                    to_status=target_status.value,
                    notes=closing_note,
                    created_at=created_at + timedelta(minutes=18),
                )
            )

    await db.commit()
    return count


async def run_cli_seed() -> None:
    async with AsyncSessionLocal() as session:
        inserted = await seed_incidents(db=session, count=100, reset=True)
        print(f"Seed finalizado com sucesso: {inserted} incidentes criados.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_cli_seed())
