export type IncidentCategory =
	| "Acidente com Veículo"
	| "Acidente com Vítimas"
	| "Condição Climática Atípica na Pista"
	| "Problema Mecânico"
	| "Bloqueio de Pista";

export type IncidentCriticality = "Alta" | "Média" | "Baixa";

export type IncidentStatus =
	| "Aberto"
	| "Em Investigação"
	| "Fechado"
	| "Inconclusivo";

export interface Incident {
	id: string;
	title: string;
	description: string;
	category: IncidentCategory;
	criticality: IncidentCriticality;
	status: IncidentStatus;
	location: string;
	truck_plate: string;
	driver_name: string;
	assigned_to: string | null;
	version: number;
	created_at: string;
	updated_at: string;
}

export interface IncidentHistory {
	id: string;
	incident_id: string;
	analyst_name: string;
	action: string;
	from_status: string | null;
	to_status: string;
	notes: string | null;
	created_at: string;
}

export interface IncidentDetail extends Incident {
	history: IncidentHistory[];
}

export interface IncidentListResponse {
	items: Incident[];
	total: number;
}

export interface IncidentFilters {
	status?: IncidentStatus;
	category?: IncidentCategory;
	criticality?: IncidentCriticality;
	search?: string;
	date_from?: string;
	date_to?: string;
	skip?: number;
	limit?: number;
}

export interface IncidentCreateInput {
	title: string;
	description: string;
	category: IncidentCategory;
	criticality: IncidentCriticality;
	location: string;
	truck_plate: string;
	driver_name: string;
	assigned_to?: string | null;
	created_at?: string;
}

export interface IncidentUpdateInput {
	title: string;
	description: string;
	category: IncidentCategory;
	criticality: IncidentCriticality;
	location: string;
	truck_plate: string;
	driver_name?: string | null;
	expected_version: number;
	version?: number;
	analyst_name: string;
	notes?: string | null;
}

export interface IncidentStatusUpdateInput {
	status: IncidentStatus;
	expected_version: number;
	version?: number;
	analyst_name: string;
	notes?: string | null;
}

export interface ErrorResponse {
	status_code: number;
	status_name: string;
	message: string;
	details?: unknown;
	request_id?: string;
}
