import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IncidentDetail } from "@/entities/incident/model/types";
import { useCockpitState } from "./useCockpitState";

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
			},
		},
	});

describe("useCockpitState", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({ items: [], total: 0 }),
			headers: new Headers({ "content-type": "application/json" }),
		} as Response);
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

	it("initializes with default state values", () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCockpitState(), { wrapper });

		expect(result.current.selectedId).toBeNull();
		expect(result.current.search).toBe("");
		expect(result.current.criticality).toBe("ALL");
		expect(result.current.status).toBe("ALL");
		expect(result.current.category).toBe("ALL");
		expect(result.current.datePreset).toBe("ALL");
		expect(result.current.dateFrom).toBe("");
		expect(result.current.dateTo).toBe("");
		expect(result.current.page).toBe(1);
		expect(result.current.pageSize).toBe(10);
		expect(result.current.occConflictTraceId).toBeNull();
		expect(result.current.isCreateModalOpen).toBe(false);
		expect(result.current.editingIncident).toBeNull();
	});

	it("resets page to 1 when filters change and supports resetting all filters", () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCockpitState(), { wrapper });

		act(() => {
			result.current.handleSearchChange("tombamento");
		});
		expect(result.current.search).toBe("tombamento");
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.handleCriticalityChange("Alta");
		});
		expect(result.current.criticality).toBe("Alta");
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.handleStatusChange("Aberto");
		});
		expect(result.current.status).toBe("Aberto");
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.handleCategoryChange("Bloqueio de Pista");
		});
		expect(result.current.category).toBe("Bloqueio de Pista");
		expect(result.current.filters.category).toBe("Bloqueio de Pista");
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.handleDatePresetChange("CUSTOM");
			result.current.handleDateRangeChange("2026-10-01", "2026-10-15");
		});
		expect(result.current.datePreset).toBe("CUSTOM");
		expect(result.current.dateFrom).toBe("2026-10-01");
		expect(result.current.dateTo).toBe("2026-10-15");
		expect(result.current.filters.date_from).toBe("2026-10-01");
		expect(result.current.filters.date_to).toBe("2026-10-15");
		expect(result.current.page).toBe(1);

		act(() => {
			result.current.handleResetFilters();
		});
		expect(result.current.search).toBe("");
		expect(result.current.criticality).toBe("ALL");
		expect(result.current.status).toBe("ALL");
		expect(result.current.category).toBe("ALL");
		expect(result.current.datePreset).toBe("ALL");
		expect(result.current.dateFrom).toBe("");
		expect(result.current.dateTo).toBe("");
		expect(result.current.page).toBe(1);
	});

	it("manages selection and modal states", () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCockpitState(), { wrapper });

		act(() => {
			result.current.setSelectedId("inc-123");
		});
		expect(result.current.selectedId).toBe("inc-123");

		act(() => {
			result.current.clearSelectedIncident();
		});
		expect(result.current.selectedId).toBeNull();

		act(() => {
			result.current.openCreateModal();
		});
		expect(result.current.isCreateModalOpen).toBe(true);

		act(() => {
			result.current.handleCreateSuccess({ id: "inc-new" });
		});
		expect(result.current.isCreateModalOpen).toBe(false);
		expect(result.current.selectedId).toBe("inc-new");

		const mockIncident: IncidentDetail = {
			id: "inc-1",
			title: "Incidente",
			description: "Desc",
			category: "Problema Mecânico",
			criticality: "Baixa",
			status: "Aberto",
			location: "SP",
			truck_plate: "ABC1D23",
			driver_name: "Motorista",
			assigned_to: null,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			version: 1,
			history: [],
		};

		act(() => {
			result.current.openEditModal(mockIncident);
		});
		expect(result.current.editingIncident).toEqual(mockIncident);

		act(() => {
			result.current.closeEditModal();
		});
		expect(result.current.editingIncident).toBeNull();
	});

	it("manages occ conflict state", () => {
		const { wrapper } = createWrapper();
		const { result } = renderHook(() => useCockpitState(), { wrapper });

		act(() => {
			result.current.handleConflictDetected("req-abc-123");
		});
		expect(result.current.occConflictTraceId).toBe("req-abc-123");

		act(() => {
			result.current.dismissConflict();
		});
		expect(result.current.occConflictTraceId).toBeNull();
	});
});
