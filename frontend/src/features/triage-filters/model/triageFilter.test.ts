import { describe, expect, it } from "vitest";
import {
	calculateDateRange,
	hasActiveFilters,
	isValidDateRange,
} from "./triageFilter";

describe("triageFilter", () => {
	const fixedDate = new Date("2026-10-19T15:00:00Z");

	it("returns empty range for ALL preset", () => {
		expect(calculateDateRange("ALL", fixedDate)).toEqual({
			dateFrom: "",
			dateTo: "",
		});
	});

	it("calculates TODAY range accurately", () => {
		expect(calculateDateRange("TODAY", fixedDate)).toEqual({
			dateFrom: "2026-10-19",
			dateTo: "2026-10-19",
		});
	});

	it("calculates LAST_7_DAYS range accurately", () => {
		expect(calculateDateRange("LAST_7_DAYS", fixedDate)).toEqual({
			dateFrom: "2026-10-13",
			dateTo: "2026-10-19",
		});
	});

	it("calculates LAST_30_DAYS range accurately", () => {
		expect(calculateDateRange("LAST_30_DAYS", fixedDate)).toEqual({
			dateFrom: "2026-09-20",
			dateTo: "2026-10-19",
		});
	});

	it("validates date range order", () => {
		expect(isValidDateRange("2026-10-01", "2026-10-19")).toBe(true);
		expect(isValidDateRange("2026-10-19", "2026-10-19")).toBe(true);
		expect(isValidDateRange("2026-10-20", "2026-10-10")).toBe(false);
		expect(isValidDateRange("", "2026-10-10")).toBe(true);
		expect(isValidDateRange("2026-10-10", "")).toBe(true);
		expect(isValidDateRange("", "")).toBe(true);
	});

	it("detects when filters are active", () => {
		expect(
			hasActiveFilters({
				search: "",
				criticality: "ALL",
				status: "ALL",
				category: "ALL",
				dateFrom: "",
				dateTo: "",
			}),
		).toBe(false);

		expect(
			hasActiveFilters({
				search: "LOG",
				criticality: "ALL",
				status: "ALL",
				category: "ALL",
				dateFrom: "",
				dateTo: "",
			}),
		).toBe(true);

		expect(
			hasActiveFilters({
				search: "",
				criticality: "Alta",
				status: "ALL",
				category: "ALL",
				dateFrom: "",
				dateTo: "",
			}),
		).toBe(true);

		expect(
			hasActiveFilters({
				search: "",
				criticality: "ALL",
				status: "ALL",
				category: "Bloqueio de Pista",
				dateFrom: "",
				dateTo: "",
			}),
		).toBe(true);

		expect(
			hasActiveFilters({
				search: "",
				criticality: "ALL",
				status: "ALL",
				category: "ALL",
				dateFrom: "2026-10-01",
				dateTo: "",
			}),
		).toBe(true);
	});
});
