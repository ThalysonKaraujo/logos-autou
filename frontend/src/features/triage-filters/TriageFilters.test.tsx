import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TriageFilters } from "./TriageFilters";

describe("TriageFilters", () => {
	const defaultProps = {
		search: "",
		onSearchChange: vi.fn(),
		selectedCriticality: "ALL" as const,
		onCriticalityChange: vi.fn(),
		selectedStatus: "ALL" as const,
		onStatusChange: vi.fn(),
	};

	it("renders all criticality buttons and search input", () => {
		render(<TriageFilters {...defaultProps} />);

		expect(
			screen.getByPlaceholderText(/Buscar por placa, título ou rodovia/i),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /^Todos/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Alta/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Média/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Baixa/i })).toBeInTheDocument();
	});

	it("displays count badges when counts prop is provided", () => {
		const counts = {
			all: 100,
			alta: 34,
			media: 33,
			baixa: 33,
		};

		render(<TriageFilters {...defaultProps} counts={counts} />);

		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText("34")).toBeInTheDocument();
		expect(screen.getAllByText("33")).toHaveLength(2);
	});

	it("calls onCriticalityChange when a button is clicked", () => {
		const onCriticalityChange = vi.fn();
		render(
			<TriageFilters
				{...defaultProps}
				onCriticalityChange={onCriticalityChange}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Alta/i }));
		expect(onCriticalityChange).toHaveBeenCalledWith("Alta");

		fireEvent.click(screen.getByRole("button", { name: /Média/i }));
		expect(onCriticalityChange).toHaveBeenCalledWith("Média");
	});

	it("calls onStatusChange when status select is changed", () => {
		const onStatusChange = vi.fn();
		render(<TriageFilters {...defaultProps} onStatusChange={onStatusChange} />);

		const select = screen.getByRole("combobox");
		fireEvent.change(select, { target: { value: "Aberto" } });

		expect(onStatusChange).toHaveBeenCalledWith("Aberto");
	});
});
