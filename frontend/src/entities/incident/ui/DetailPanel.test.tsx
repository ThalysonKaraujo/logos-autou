import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IncidentDetail } from "@/entities/incident/model/types";
import { OperatorProvider } from "@/features/operator-session";
import { DetailPanel } from "./DetailPanel";

const mockIncident: IncidentDetail = {
	id: "inc-1",
	title: "Tombamento na BR-116",
	description: "Carreta tombou interditando pista",
	category: "Acidente com Veículo",
	criticality: "Alta",
	status: "Fechado",
	location: "BR-116, Km 340",
	truck_plate: "LOG0A10",
	driver_name: "Marcos Oliveira",
	assigned_to: "Mariana Silva",
	version: 2,
	created_at: "2026-10-12T12:00:00Z",
	updated_at: "2026-10-12T14:00:00Z",
	history: [],
};

describe("DetailPanel", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	const renderComponent = (incidentId: string | null) => {
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		return render(
			<QueryClientProvider client={queryClient}>
				<OperatorProvider>
					<DetailPanel incidentId={incidentId} />
				</OperatorProvider>
			</QueryClientProvider>,
		);
	};

	it("renders empty state when no incident is selected", () => {
		renderComponent(null);
		expect(screen.getByText("Nenhum chamado selecionado")).toBeInTheDocument();
	});

	it("renders reopen button enabled when status is Fechado and triggers status update to Aberto", async () => {
		const fetchMock = vi
			.fn()
			.mockImplementation((url: string, init?: RequestInit) => {
				if (
					typeof url === "string" &&
					url.endsWith("/api/v1/incidents/inc-1")
				) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () => mockIncident,
						headers: new Headers({ "content-type": "application/json" }),
					} as Response);
				}
				if (
					typeof url === "string" &&
					url.endsWith("/api/v1/incidents/inc-1/status") &&
					init?.method === "PATCH"
				) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () => ({
							...mockIncident,
							status: "Aberto",
							version: 3,
						}),
						headers: new Headers({ "content-type": "application/json" }),
					} as Response);
				}
				return Promise.reject(new Error(`Unhandled URL: ${url}`));
			});
		globalThis.fetch = fetchMock;

		renderComponent("inc-1");

		const reopenButton = await screen.findByRole("button", {
			name: /reabrir chamado/i,
		});
		expect(reopenButton).toBeEnabled();

		fireEvent.click(reopenButton);

		await waitFor(() => {
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining("/api/v1/incidents/inc-1/status"),
				expect.objectContaining({
					method: "PATCH",
					body: expect.stringContaining('"status":"Aberto"'),
				}),
			);
		});
	});

	it("disables reopen button when status is already Aberto", async () => {
		globalThis.fetch = vi.fn().mockImplementation((url: string) => {
			if (typeof url === "string" && url.endsWith("/api/v1/incidents/inc-1")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => ({ ...mockIncident, status: "Aberto" }),
					headers: new Headers({ "content-type": "application/json" }),
				} as Response);
			}
			return Promise.reject(new Error(`Unhandled URL: ${url}`));
		});

		renderComponent("inc-1");

		const reopenButton = await screen.findByRole("button", {
			name: /reabrir chamado/i,
		});
		expect(reopenButton).toBeDisabled();
	});

	it("renders mobile back to list button and triggers onBackToList when clicked", async () => {
		const onBackToList = vi.fn();
		globalThis.fetch = vi.fn().mockImplementation((url: string) => {
			if (typeof url === "string" && url.endsWith("/api/v1/incidents/inc-1")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					json: async () => mockIncident,
					headers: new Headers({ "content-type": "application/json" }),
				} as Response);
			}
			return Promise.reject(new Error(`Unhandled URL: ${url}`));
		});

		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		render(
			<QueryClientProvider client={queryClient}>
				<OperatorProvider>
					<DetailPanel incidentId="inc-1" onBackToList={onBackToList} />
				</OperatorProvider>
			</QueryClientProvider>,
		);

		const backButton = await screen.findByRole("button", {
			name: /voltar.*fila/i,
		});
		expect(backButton).toBeInTheDocument();
		fireEvent.click(backButton);
		expect(onBackToList).toHaveBeenCalledTimes(1);
	});

	it("displays loading state and spinner on the specific action button while mutation is pending", async () => {
		let resolveMutation: (val: unknown) => void = () => {};
		const mutationPromise = new Promise((resolve) => {
			resolveMutation = resolve;
		});

		globalThis.fetch = vi
			.fn()
			.mockImplementation((url: string, init?: RequestInit) => {
				if (
					typeof url === "string" &&
					url.endsWith("/api/v1/incidents/inc-1") &&
					(!init || init.method === "GET")
				) {
					return Promise.resolve({
						ok: true,
						status: 200,
						json: async () => ({ ...mockIncident, status: "Aberto" }),
						headers: new Headers({ "content-type": "application/json" }),
					} as Response);
				}
				if (
					typeof url === "string" &&
					url.endsWith("/api/v1/incidents/inc-1/status") &&
					init?.method === "PATCH"
				) {
					return mutationPromise.then(
						() =>
							({
								ok: true,
								status: 200,
								json: async () => ({
									...mockIncident,
									status: "Em Investigação",
									version: 3,
								}),
								headers: new Headers({ "content-type": "application/json" }),
							}) as Response,
					);
				}
				return Promise.reject(new Error(`Unhandled URL: ${url}`));
			});

		renderComponent("inc-1");

		const assumeButton = await screen.findByRole("button", {
			name: /assumir investigação/i,
		});
		expect(assumeButton).toBeEnabled();

		fireEvent.click(assumeButton);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /assumindo/i }),
			).toBeInTheDocument();
		});

		resolveMutation(null);

		await waitFor(() => {
			expect(
				screen.queryByRole("button", { name: /assumindo/i }),
			).not.toBeInTheDocument();
		});
	});
});
