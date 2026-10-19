import { describe, expect, it } from "vitest";
import {
	formatRelativeTime,
	formatShortDate,
	getTodayIsoDate,
} from "./format-date";

describe("format-date", () => {
	it("formats ISO datetime string to dd/mm/yyyy", () => {
		expect(formatShortDate("2026-10-19T14:30:00Z")).toBe("19/10/2026");
		expect(formatShortDate("2026-01-05T00:00:00Z")).toBe("05/01/2026");
		expect(formatShortDate("2026-10-12")).toBe("12/10/2026");
	});

	it("returns fallback when date string is invalid", () => {
		expect(formatShortDate("invalid-date")).toBe("--/--/----");
	});

	it("formats relative time accurately", () => {
		const now = new Date("2026-10-19T15:00:00Z").getTime();

		expect(formatRelativeTime("2026-10-19T14:59:45Z", now)).toBe("Agora");
		expect(formatRelativeTime("2026-10-19T14:40:00Z", now)).toBe("20 min");
		expect(formatRelativeTime("2026-10-19T10:00:00Z", now)).toBe("5h");
		expect(formatRelativeTime("2026-10-16T15:00:00Z", now)).toBe("3d");
	});

	it("returns YYYY-MM-DD for getTodayIsoDate", () => {
		const ref = new Date("2026-10-19T18:00:00Z");
		expect(getTodayIsoDate(ref)).toBe("2026-10-19");
	});
});
