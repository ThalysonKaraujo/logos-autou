import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationToast } from "./NotificationToast";

describe("NotificationToast", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders title and message correctly", () => {
		render(
			<NotificationToast
				type="success"
				title="Chamado registrado com sucesso!"
				message="LOG0A10 • Pane de arrefecimento"
				onClose={vi.fn()}
			/>,
		);

		expect(
			screen.getByText("Chamado registrado com sucesso!"),
		).toBeInTheDocument();
		expect(
			screen.getByText("LOG0A10 • Pane de arrefecimento"),
		).toBeInTheDocument();
	});

	it("renders success state with proper role and allows manual dismiss", () => {
		const onClose = vi.fn();
		render(
			<NotificationToast
				type="success"
				title="Operação concluída"
				onClose={onClose}
			/>,
		);

		const alert = screen.getByRole("status");
		expect(alert).toBeInTheDocument();

		const closeButton = screen.getByRole("button", {
			name: /fechar notificação/i,
		});
		fireEvent.click(closeButton);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("renders error state with alert role", () => {
		render(
			<NotificationToast
				type="error"
				title="Falha na operação"
				message="Sem conexão de rede"
				onClose={vi.fn()}
			/>,
		);

		expect(screen.getByRole("alert")).toBeInTheDocument();
		expect(screen.getByText("Falha na operação")).toBeInTheDocument();
		expect(screen.getByText("Sem conexão de rede")).toBeInTheDocument();
	});

	it("auto dismisses after timeout", () => {
		const onClose = vi.fn();
		render(
			<NotificationToast
				type="success"
				title="Notificação com timeout"
				duration={3000}
				onClose={onClose}
			/>,
		);

		expect(onClose).not.toHaveBeenCalled();

		act(() => {
			vi.advanceTimersByTime(3000);
		});

		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
