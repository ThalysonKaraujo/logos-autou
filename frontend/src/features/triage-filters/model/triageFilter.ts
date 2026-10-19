import type {
	IncidentCategory,
	IncidentCriticality,
	IncidentStatus,
} from "@/entities/incident/model/types";

export type DatePreset =
	| "ALL"
	| "TODAY"
	| "LAST_7_DAYS"
	| "LAST_30_DAYS"
	| "CUSTOM";

export interface DateRange {
	dateFrom: string;
	dateTo: string;
}

export interface CriticalityCounts {
	all: number;
	alta: number;
	media: number;
	baixa: number;
}

export interface ActiveFilterCheckParams {
	search: string;
	criticality: IncidentCriticality | "ALL";
	status: IncidentStatus | "ALL";
	category: IncidentCategory | "ALL";
	dateFrom: string;
	dateTo: string;
}

export const DATE_PRESET_OPTIONS: ReadonlyArray<{
	value: DatePreset;
	label: string;
}> = [
	{ value: "ALL", label: "Período: Todos" },
	{ value: "TODAY", label: "Hoje" },
	{ value: "LAST_7_DAYS", label: "Últimos 7 dias" },
	{ value: "LAST_30_DAYS", label: "Últimos 30 dias" },
	{ value: "CUSTOM", label: "Personalizado" },
];

export const CATEGORY_OPTIONS: ReadonlyArray<{
	value: IncidentCategory | "ALL";
	label: string;
}> = [
	{ value: "ALL", label: "Categoria: Todas" },
	{ value: "Acidente com Veículo", label: "Acidente com Veículo" },
	{ value: "Acidente com Vítimas", label: "Acidente com Vítimas" },
	{
		value: "Condição Climática Atípica na Pista",
		label: "Condição Climática Atípica na Pista",
	},
	{ value: "Problema Mecânico", label: "Problema Mecânico" },
	{ value: "Bloqueio de Pista", label: "Bloqueio de Pista" },
];

export const STATUS_OPTIONS: ReadonlyArray<{
	value: IncidentStatus | "ALL";
	label: string;
}> = [
	{ value: "ALL", label: "Status: Todos" },
	{ value: "Aberto", label: "Aberto" },
	{ value: "Em Investigação", label: "Em Investigação" },
	{ value: "Fechado", label: "Fechado" },
	{ value: "Inconclusivo", label: "Inconclusivo" },
];

const formatIsoDate = (date: Date): string => {
	return date.toISOString().slice(0, 10);
};

export const calculateDateRange = (
	preset: DatePreset,
	referenceDate: Date = new Date(),
): DateRange => {
	if (preset === "ALL" || preset === "CUSTOM") {
		return { dateFrom: "", dateTo: "" };
	}

	const end = new Date(referenceDate);
	const start = new Date(referenceDate);

	if (preset === "LAST_7_DAYS") {
		start.setUTCDate(start.getUTCDate() - 6);
	} else if (preset === "LAST_30_DAYS") {
		start.setUTCDate(start.getUTCDate() - 29);
	}

	return {
		dateFrom: formatIsoDate(start),
		dateTo: formatIsoDate(end),
	};
};

export const isValidDateRange = (dateFrom: string, dateTo: string): boolean => {
	if (!dateFrom || !dateTo) return true;
	return dateFrom <= dateTo;
};

export const hasActiveFilters = ({
	search,
	criticality,
	status,
	category,
	dateFrom,
	dateTo,
}: ActiveFilterCheckParams): boolean => {
	return (
		search.trim() !== "" ||
		criticality !== "ALL" ||
		status !== "ALL" ||
		category !== "ALL" ||
		dateFrom !== "" ||
		dateTo !== ""
	);
};
