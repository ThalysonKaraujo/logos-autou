import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { OperatorProvider } from "@/features/operator-session";
import { ThemeProvider } from "@/features/theme";
import { Topbar } from "./Topbar";

describe("Topbar", () => {
	const renderTopbar = (props = {}) => {
		const defaultProps = {
			onOpenNewIncident: vi.fn(),
			...props,
		};

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<ThemeProvider>
				<OperatorProvider>{children}</OperatorProvider>
			</ThemeProvider>
		);

		const result = render(<Topbar {...defaultProps} />, { wrapper });
		return { ...result, props: defaultProps };
	};

	it("renders title branding", () => {
		renderTopbar();
		expect(screen.getByText("LOGOS")).toBeInTheDocument();
		expect(screen.getByText("Central de Incidentes")).toBeInTheDocument();
	});

	it("renders operator selector with initial operator and allows changing", () => {
		renderTopbar();

		const select = screen.getByRole("combobox") as HTMLSelectElement;
		expect(select.value).toBe("Carlos Mendes");

		fireEvent.change(select, { target: { value: "Fernanda Costa" } });
		expect(select.value).toBe("Fernanda Costa");
	});

	it("calls onOpenNewIncident when new incident button is clicked", () => {
		const { props } = renderTopbar();

		const button = screen.getByRole("button", { name: /\+ Novo Chamado/i });
		fireEvent.click(button);

		expect(props.onOpenNewIncident).toHaveBeenCalledTimes(1);
	});

	it("renders offline indicator when network is disconnected", () => {
		const originalOnLine = navigator.onLine;
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: false,
			writable: true,
		});

		renderTopbar();

		expect(screen.getByText("Sem conexão")).toBeInTheDocument();
		expect(screen.getByRole("status")).toHaveAttribute(
			"aria-label",
			"Sem conexão de rede",
		);

		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: originalOnLine,
			writable: true,
		});
	});
});
