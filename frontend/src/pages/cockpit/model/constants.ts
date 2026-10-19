import type { IncidentSortBy } from "@/entities/incident/model/types";

export const PAGE_SIZE = 10;

export const QUEUE_SORT_OPTIONS: ReadonlyArray<{
	value: IncidentSortBy;
	label: string;
}> = [
	{ value: "criticality_desc", label: "Prioridade: Alta > Baixa" },
	{ value: "criticality_asc", label: "Prioridade: Baixa > Alta" },
	{ value: "created_at_desc", label: "Mais recentes" },
	{ value: "created_at_asc", label: "Mais antigos" },
	{ value: "updated_at_desc", label: "Última atualização" },
];
