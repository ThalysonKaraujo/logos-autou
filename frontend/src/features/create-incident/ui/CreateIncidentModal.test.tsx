import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperatorProvider } from "@/features/operator-session";
import { CreateIncidentModal } from "./CreateIncidentModal";

const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});

describe("CreateIncidentModal", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	const renderModal = (props = {}) => {
		const defaultProps = {
			isOpen: true,
			onClose: vi.fn(),
			onSuccess: vi.fn(),
			...props,
		};

		const queryClient = createTestQueryClient();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<QueryClientProvider client={queryClient}>
				<OperatorProvider>{children}</OperatorProvider>
			</QueryClientProvider>
		);

		const result = render(<CreateIncidentModal {...defaultProps} />, {
			wrapper,
		});
		return { ...result, props: defaultProps };
	};

	it("does not render when isOpen is false", () => {
		renderModal({ isOpen: false });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders all form fields when isOpen is true", () => {
		renderModal();
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Placa/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Motorista/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Categoria/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Criticidade/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Data da Ocorrência/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Localização/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Criar Chamado/i }),
		).toBeInTheDocument();
	});

	it("calls onClose when close button is clicked", () => {
		const { props } = renderModal();
		const closeButton = screen.getByRole("button", { name: /Fechar modal/i });
		fireEvent.click(closeButton);
		expect(props.onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when cancel button is clicked", () => {
		const { props } = renderModal();
		const cancelButton = screen.getByRole("button", { name: /Cancelar/i });
		fireEvent.click(cancelButton);
		expect(props.onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when Escape key is pressed", () => {
		const { props } = renderModal();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(props.onClose).toHaveBeenCalledTimes(1);
	});

	it("shows error when plate format is invalid", async () => {
		renderModal();

		const plateInput = screen.getByLabelText(/Placa/i);
		fireEvent.change(plateInput, { target: { value: "INVALID" } });
		fireEvent.blur(plateInput);

		await waitFor(() => {
			expect(screen.getByText(/Placa inválida/i)).toBeInTheDocument();
		});
	});

	it("submits form successfully with custom date and calls onSuccess", async () => {
		const mockCreated = {
			id: "inc-new-1",
			title: "Pane de arrefecimento",
			description: "Superaquecimento na subida da serra",
			category: "Problema Mecânico",
			criticality: "Alta",
			status: "Aberto",
			location: "BR-101, Km 50",
			truck_plate: "LOG1A23",
			driver_name: "Marcos Lima",
			assigned_to: null,
			version: 1,
			created_at: "2026-10-12T12:00:00Z",
			updated_at: "2026-10-12T12:00:00Z",
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 201,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => mockCreated,
		});

		const { props } = renderModal();

		fireEvent.change(screen.getByLabelText(/Título/i), {
			target: { value: "Pane de arrefecimento" },
		});
		fireEvent.change(screen.getByLabelText(/Placa/i), {
			target: { value: "LOG1A23" },
		});
		fireEvent.change(screen.getByLabelText(/Motorista/i), {
			target: { value: "Marcos Lima" },
		});
		fireEvent.change(screen.getByLabelText(/Data da Ocorrência/i), {
			target: { value: "2026-10-12" },
		});
		fireEvent.change(screen.getByLabelText(/Localização/i), {
			target: { value: "BR-101, Km 50" },
		});
		fireEvent.change(screen.getByLabelText(/Descrição/i), {
			target: { value: "Superaquecimento na subida da serra" },
		});

		const submitButton = screen.getByRole("button", { name: /Criar Chamado/i });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(props.onSuccess).toHaveBeenCalledWith(mockCreated);
		});

		const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
		const requestBody = JSON.parse(fetchCall[1]?.body as string);
		expect(requestBody.created_at).toBe("2026-10-12");
	});

	it("renders structured error alert when submission fails", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 500,
			headers: new Headers({ "content-type": "application/json" }),
			json: async () => ({ message: "Erro de banco de dados" }),
		});

		renderModal();

		fireEvent.change(screen.getByLabelText(/Título/i), {
			target: { value: "Pane de arrefecimento" },
		});
		fireEvent.change(screen.getByLabelText(/Placa/i), {
			target: { value: "LOG1A23" },
		});
		fireEvent.change(screen.getByLabelText(/Localização/i), {
			target: { value: "BR-101, Km 50" },
		});
		fireEvent.change(screen.getByLabelText(/Descrição/i), {
			target: { value: "Superaquecimento na subida da serra" },
		});

		const submitButton = screen.getByRole("button", { name: /Criar Chamado/i });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
			expect(
				screen.getByText("Falha ao registrar chamado"),
			).toBeInTheDocument();
			expect(screen.getByText("Erro de banco de dados")).toBeInTheDocument();
		});
	});

	it("triggers showPicker when date input is clicked", () => {
		const showPickerMock = vi.fn();
		renderModal();

		const dateInput =
			screen.getByLabelText<HTMLInputElement>(/Data da Ocorrência/i);
		dateInput.showPicker = showPickerMock;

		fireEvent.click(dateInput);
		expect(showPickerMock).toHaveBeenCalledTimes(1);
	});
});
