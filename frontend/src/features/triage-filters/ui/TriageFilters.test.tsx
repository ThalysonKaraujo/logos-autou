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
		selectedCategory: "ALL" as const,
		onCategoryChange: vi.fn(),
		datePreset: "ALL" as const,
		onDatePresetChange: vi.fn(),
		dateFrom: "",
		dateTo: "",
		onDateRangeChange: vi.fn(),
		onResetFilters: vi.fn(),
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

		const select = screen.getByLabelText("Filtrar por status");
		fireEvent.change(select, { target: { value: "Aberto" } });

		expect(onStatusChange).toHaveBeenCalledWith("Aberto");
	});

	it("calls onCategoryChange when category select is changed", () => {
		const onCategoryChange = vi.fn();
		render(
			<TriageFilters {...defaultProps} onCategoryChange={onCategoryChange} />,
		);

		const select = screen.getByLabelText("Filtrar por categoria");
		fireEvent.change(select, { target: { value: "Bloqueio de Pista" } });

		expect(onCategoryChange).toHaveBeenCalledWith("Bloqueio de Pista");
	});

	it("handles date preset and custom date range inputs", () => {
		const onDatePresetChange = vi.fn();
		const onDateRangeChange = vi.fn();
		render(
			<TriageFilters
				{...defaultProps}
				onDatePresetChange={onDatePresetChange}
				onDateRangeChange={onDateRangeChange}
			/>,
		);

		const presetSelect = screen.getByLabelText("Filtrar por período");
		fireEvent.change(presetSelect, { target: { value: "LAST_7_DAYS" } });

		expect(onDatePresetChange).toHaveBeenCalledWith("LAST_7_DAYS");
		expect(onDateRangeChange).toHaveBeenCalled();

		const dateFromInput = screen.getByLabelText("Data inicial");
		fireEvent.change(dateFromInput, { target: { value: "2026-10-01" } });

		expect(onDatePresetChange).toHaveBeenCalledWith("CUSTOM");
		expect(onDateRangeChange).toHaveBeenCalledWith("2026-10-01", "");
	});

	it("shows clear filters button when filters are active and triggers onResetFilters", () => {
		const onResetFilters = vi.fn();
		render(
			<TriageFilters
				{...defaultProps}
				selectedCriticality="Alta"
				dateFrom="2026-10-01"
				onResetFilters={onResetFilters}
			/>,
		);

		const resetBtn = screen.getByRole("button", { name: /Limpar filtros/i });
		expect(resetBtn).toBeInTheDocument();

		fireEvent.click(resetBtn);
		expect(onResetFilters).toHaveBeenCalledTimes(1);
	});

	it("triggers showPicker when date input is clicked", () => {
		const showPickerMock = vi.fn();
		render(<TriageFilters {...defaultProps} />);

		const dateFromInput =
			screen.getByLabelText<HTMLInputElement>("Data inicial");
		dateFromInput.showPicker = showPickerMock;

		fireEvent.click(dateFromInput);
		expect(showPickerMock).toHaveBeenCalledTimes(1);
	});
});
