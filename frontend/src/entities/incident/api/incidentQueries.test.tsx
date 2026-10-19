import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	Incident,
	IncidentDetail,
	IncidentListResponse,
} from "../model/types";
import {
	useCreateIncident,
	useIncidentDetail,
	useIncidents,
	useUpdateIncidentStatus,
} from "./incidentQueries";

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

describe("incidentQueries", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	const createWrapper = () => {
		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
		return { queryClient, wrapper };
	};

	it("fetches incidents list with formatted query params", async () => {
		const mockResponse: IncidentListResponse = {
			items: [
				{
					id: "inc-1",
					title: "Tombamento em rodovia",
					description: "Carreta tombou no acostamento",
					category: "Acidente com Veículo",
					criticality: "Alta",
					status: "Aberto",
					location: "BR-116",
					truck_plate: "LOG0A10",
					driver_name: "Marcos Oliveira",
					assigned_to: null,
					version: 1,
					created_at: "2026-10-18T10:00:00Z",
					updated_at: "2026-10-18T10:00:00Z",
				},
			],
			total: 1,
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => mockResponse,
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(
			() =>
				useIncidents({
					criticality: "Alta",
					status: "Aberto",
					category: "Acidente com Veículo",
					date_from: "2026-10-01",
					date_to: "2026-10-19",
					sort_by: "created_at_desc",
					limit: 10,
				}),
			{ wrapper },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.items).toHaveLength(1);
		expect(result.current.data?.total).toBe(1);

		const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
		const requestedUrl = fetchCall[0] as string;
		expect(requestedUrl).toContain("criticality=Alta");
		expect(requestedUrl).toContain("status=Aberto");
		expect(requestedUrl).toContain("date_from=2026-10-01");
		expect(requestedUrl).toContain("date_to=2026-10-19");
		expect(requestedUrl).toContain("sort_by=created_at_desc");
		expect(requestedUrl).toContain("limit=10");
	});

	it("fetches single incident detail by id including audit history", async () => {
		const mockDetail: IncidentDetail = {
			id: "inc-99",
			title: "Pane no motor",
			description: "Superaquecimento do bloco",
			category: "Problema Mecânico",
			criticality: "Média",
			status: "Em Investigação",
			location: "BR-101",
			truck_plate: "LOG1B11",
			driver_name: "Roberto Santos",
			assigned_to: "Carlos Mendes",
			version: 2,
			created_at: "2026-10-18T10:00:00Z",
			updated_at: "2026-10-18T10:15:00Z",
			history: [
				{
					id: "hist-1",
					incident_id: "inc-99",
					analyst_name: "Carlos Mendes",
					action: "STATUS_CHANGED",
					from_status: "Aberto",
					to_status: "Em Investigação",
					notes: "Acionado suporte mecânico",
					created_at: "2026-10-18T10:15:00Z",
				},
			],
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => mockDetail,
		});

		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useIncidentDetail("inc-99"), {
			wrapper,
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));

		expect(result.current.data?.id).toBe("inc-99");
		expect(result.current.data?.history).toHaveLength(1);
		expect(result.current.data?.history[0].analyst_name).toBe("Carlos Mendes");
	});

	it("updates incident status and invalidates query cache", async () => {
		const updatedIncident: IncidentDetail = {
			id: "inc-1",
			title: "Tombamento em rodovia",
			description: "Carreta tombou no acostamento",
			category: "Acidente com Veículo",
			criticality: "Alta",
			status: "Fechado",
			location: "BR-116",
			truck_plate: "LOG0A10",
			driver_name: "Marcos Oliveira",
			assigned_to: "Fernanda Costa",
			version: 2,
			created_at: "2026-10-18T10:00:00Z",
			updated_at: "2026-10-18T10:30:00Z",
			history: [],
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => updatedIncident,
		});

		const { wrapper, queryClient } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useUpdateIncidentStatus(), { wrapper });

		await result.current.mutateAsync({
			incidentId: "inc-1",
			payload: {
				status: "Fechado",
				expected_version: 1,
				version: 1,
				analyst_name: "Fernanda Costa",
				notes: "Veículo destombado e liberado",
			},
		});

		expect(invalidateSpy).toHaveBeenCalled();
	});

	it("creates new incident and invalidates list query cache", async () => {
		const newIncident: Incident = {
			id: "inc-new-123",
			title: "Colisão traseira leve",
			description: "Impacto no para-choque",
			category: "Acidente com Veículo",
			criticality: "Baixa",
			status: "Aberto",
			location: "BR-381",
			truck_plate: "LOG2C12",
			driver_name: "Cláudio Ferreira",
			assigned_to: null,
			version: 1,
			created_at: "2026-10-18T11:00:00Z",
			updated_at: "2026-10-18T11:00:00Z",
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 201,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => newIncident,
		});

		const { wrapper, queryClient } = createWrapper();
		const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

		const { result } = renderHook(() => useCreateIncident(), { wrapper });

		await result.current.mutateAsync({
			title: "Colisão traseira leve",
			description: "Impacto no para-choque",
			category: "Acidente com Veículo",
			criticality: "Baixa",
			location: "BR-381",
			truck_plate: "LOG2C12",
			driver_name: "Cláudio Ferreira",
		});

		expect(invalidateSpy).toHaveBeenCalled();
	});
});
