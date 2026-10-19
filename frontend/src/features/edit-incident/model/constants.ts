import type {
	IncidentCategory,
	IncidentCriticality,
} from "@/entities/incident/model/types";

export const CATEGORIES: IncidentCategory[] = [
	"Acidente com Veículo",
	"Acidente com Vítimas",
	"Condição Climática Atípica na Pista",
	"Problema Mecânico",
	"Bloqueio de Pista",
];

export const CRITICALITIES: IncidentCriticality[] = ["Alta", "Média", "Baixa"];
