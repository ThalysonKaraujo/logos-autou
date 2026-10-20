import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConflictModal } from "./ConflictModal";

describe("ConflictModal", () => {
	const defaultProps = {
		isOpen: true,
		onClose: vi.fn(),
		onReloadLatest: vi.fn(),
		traceId: "test-trace-123",
		expectedVersion: 1,
		currentVersion: 2,
		serverState: {
			id: "inc-1",
			title: "Incidente no Servidor",
			status: "Em Investigação",
			criticality: "Alta",
			category: "Acidente com Veículo",
			assigned_to: "Mariana Silva",
			version: 2,
			location: "BR-116",
			truck_plate: "ABC1D23",
			driver_name: "João Silva",
		},
		attemptedState: {
			title: "Minha Tentativa de Edição",
			status: "Fechado",
			notes: "Resolução do caso com guincho",
		},
	};

	it("does not render when isOpen is false", () => {
		const { container } = render(
			<ConflictModal {...defaultProps} isOpen={false} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders conflict modal details and diff rows when isOpen is true", () => {
		render(<ConflictModal {...defaultProps} />);

		expect(
			screen.getByText("Conflito de Concorrência Detectado (OCC)"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/X-Request-ID: test-trace-123/),
		).toBeInTheDocument();

		expect(screen.getByText("Em Investigação")).toBeInTheDocument();
		expect(screen.getByText("Fechado")).toBeInTheDocument();
		expect(screen.getByText("Mariana Silva")).toBeInTheDocument();
		expect(screen.getByText("v1")).toBeInTheDocument();
		expect(screen.getByText("v2")).toBeInTheDocument();
	});

	it("displays notes and copies to clipboard when copy button is clicked", async () => {
		const writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.assign(navigator, {
			clipboard: {
				writeText: writeTextMock,
			},
		});

		render(<ConflictModal {...defaultProps} />);

		expect(
			screen.getByText("Resolução do caso com guincho"),
		).toBeInTheDocument();

		const copyBtn = screen.getByRole("button", { name: /copiar anotações/i });
		act(() => {
			fireEvent.click(copyBtn);
		});

		expect(writeTextMock).toHaveBeenCalledWith("Resolução do caso com guincho");
	});

	it("calls onReloadLatest and onClose when reload button is clicked", () => {
		const onReloadLatest = vi.fn();
		const onClose = vi.fn();

		render(
			<ConflictModal
				{...defaultProps}
				onReloadLatest={onReloadLatest}
				onClose={onClose}
			/>,
		);

		const reloadBtn = screen.getByRole("button", {
			name: /recarregar dados mais recentes/i,
		});
		fireEvent.click(reloadBtn);

		expect(onReloadLatest).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when close icon or footer button is clicked", () => {
		const onClose = vi.fn();
		render(<ConflictModal {...defaultProps} onClose={onClose} />);

		const closeIcon = screen.getByRole("button", {
			name: "Fechar modal de conflito",
		});
		fireEvent.click(closeIcon);

		expect(onClose).toHaveBeenCalledTimes(1);

		const footerCloseBtn = screen.getByRole("button", { name: /^fechar$/i });
		fireEvent.click(footerCloseBtn);

		expect(onClose).toHaveBeenCalledTimes(2);
	});
});
