import type { IncidentSortBy } from "@/entities/incident/model/types";

export const PAGE_SIZE = 10;

export const QUEUE_SORT_OPTIONS: ReadonlyArray<{
	value: IncidentSortBy;
	label: string;
}> = [
	{ value: "criticality_desc", label: "Ordem: Alta > Média > Baixa" },
	{ value: "criticality_asc", label: "Ordem: Baixa > Média > Alta" },
	{ value: "created_at_desc", label: "Ordem: Mais recentes" },
	{ value: "created_at_asc", label: "Ordem: Mais antigos" },
	{ value: "updated_at_desc", label: "Ordem: Última atualização" },
];
