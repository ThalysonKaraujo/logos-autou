import { fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { OperatorProvider } from "@/features/operator-session";
import { Topbar } from "./Topbar";

describe("Topbar", () => {
	const renderTopbar = (props = {}) => {
		const defaultProps = {
			onOpenNewIncident: vi.fn(),
			onSimulateOCC: vi.fn(),
			...props,
		};

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<OperatorProvider>{children}</OperatorProvider>
		);

		const result = render(<Topbar {...defaultProps} />, { wrapper });
		return { ...result, props: defaultProps };
	};

	it("renders title branding and fleet info", () => {
		renderTopbar();
		expect(screen.getByText("LOGOS")).toBeInTheDocument();
		expect(screen.getByText("Central de Incidentes")).toBeInTheDocument();
		expect(screen.getByText("(AutoU 5.000)")).toBeInTheDocument();
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

	it("calls onSimulateOCC when simulate OCC button is clicked", () => {
		const { props } = renderTopbar();

		const button = screen.getByRole("button", {
			name: /Simular OCC \(409\)/i,
		});
		fireEvent.click(button);

		expect(props.onSimulateOCC).toHaveBeenCalledTimes(1);
	});
});
