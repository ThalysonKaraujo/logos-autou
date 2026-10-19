import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTriageFilters } from "./useTriageFilters";

describe("useTriageFilters", () => {
	const createProps = () => ({
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
	});

	it("computes isFiltering and dateError states accurately", () => {
		const props = createProps();
		const { result, rerender } = renderHook((p) => useTriageFilters(p), {
			initialProps: props,
		});

		expect(result.current.isFiltering).toBe(false);
		expect(result.current.hasDateError).toBe(false);

		rerender({
			...props,
			dateFrom: "2026-10-20",
			dateTo: "2026-10-10",
		});

		expect(result.current.isFiltering).toBe(true);
		expect(result.current.hasDateError).toBe(true);
	});

	it("delegates preset changes and computes date range when preset is selected", () => {
		const props = createProps();
		const { result } = renderHook(() => useTriageFilters(props));

		act(() => {
			result.current.handlePresetSelect("TODAY");
		});

		expect(props.onDatePresetChange).toHaveBeenCalledWith("TODAY");
	});

	it("updates custom date range and switches preset to CUSTOM when manual dates change", () => {
		const props = createProps();
		const { result } = renderHook(() => useTriageFilters(props));

		act(() => {
			result.current.handleDateFromChange("2026-10-05");
		});

		expect(props.onDatePresetChange).toHaveBeenCalledWith("CUSTOM");
		expect(props.onDateRangeChange).toHaveBeenCalledWith("2026-10-05", "");
	});

	it("focuses search input when slash key is pressed", () => {
		const props = createProps();
		const { result } = renderHook(() => useTriageFilters(props));

		const input = document.createElement("input");
		const focusSpy = vi.spyOn(input, "focus");
		result.current.searchInputRef.current = input;

		act(() => {
			window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
		});

		expect(focusSpy).toHaveBeenCalled();
	});
});
