import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IncidentDetail } from "@/entities/incident/model/types";
import { OperatorProvider } from "@/features/operator-session";
import { EditIncidentModal } from "./EditIncidentModal";

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

const mockIncident: IncidentDetail = {
	id: "inc-edit-1",
	title: "Falha no freio motor",
	description: "Perda de pressão pneumática na descida",
	category: "Problema Mecânico",
	criticality: "Média",
	status: "Em Investigação",
	location: "BR-116, Km 210",
	truck_plate: "LOG9B88",
	driver_name: "Roberto Alves",
	assigned_to: "Operador-01",
	version: 3,
	created_at: "2026-10-18T10:00:00Z",
	updated_at: "2026-10-18T10:30:00Z",
	history: [],
};

describe("EditIncidentModal", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	const renderModal = (props = {}) => {
		const defaultProps = {
			incident: mockIncident,
			isOpen: true,
			onClose: vi.fn(),
			onConflictDetected: vi.fn(),
			...props,
		};

		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<OperatorProvider>{children}</OperatorProvider>
			</QueryClientProvider>
		);

		const result = render(<EditIncidentModal {...defaultProps} />, {
			wrapper,
		});
		return { ...result, props: defaultProps };
	};

	it("does not render when isOpen is false", () => {
		renderModal({ isOpen: false });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders pre-filled incident fields and version badge", () => {
		renderModal();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByText("v3")).toBeInTheDocument();
		expect(screen.getByLabelText(/Título/i)).toHaveValue(
			"Falha no freio motor",
		);
		expect(screen.getByLabelText(/Placa/i)).toHaveValue("LOG9B88");
		expect(screen.getByLabelText(/Localização/i)).toHaveValue("BR-116, Km 210");
	});

	it("submits updated fields with expected_version and closes modal", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({
				...mockIncident,
				criticality: "Alta",
				version: 4,
			}),
		});

		const { props } = renderModal();

		fireEvent.change(screen.getByLabelText(/Criticidade/i), {
			target: { value: "Alta" },
		});
		fireEvent.change(screen.getByLabelText(/Justificativa/i), {
			target: { value: "Agravamento confirmado" },
		});

		fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

		await waitFor(() => {
			expect(props.onClose).toHaveBeenCalledTimes(1);
		});
	});

	it("triggers onConflictDetected and closes modal on 409 OCC response", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 409,
			headers: new Headers({
				"content-type": "application/json",
				"x-request-id": "req-conflict-99",
			}),
			json: async () => ({
				status_code: 409,
				status_name: "Conflict",
				message: "Conflito de versão",
			}),
		});

		const { props } = renderModal();

		fireEvent.change(screen.getByLabelText(/Localização/i), {
			target: { value: "BR-116, Km 215" },
		});

		fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações/i }));

		await waitFor(() => {
			expect(props.onClose).toHaveBeenCalledTimes(1);
			expect(props.onConflictDetected).toHaveBeenCalledWith(
				"req-conflict-99",
				null,
				expect.objectContaining({
					location: "BR-116, Km 215",
				}),
			);
		});
	});
});
