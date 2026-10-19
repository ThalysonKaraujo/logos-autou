import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useNetworkStatus } from "./useNetworkStatus";

describe("useNetworkStatus", () => {
	const originalOnLine = navigator.onLine;

	beforeEach(() => {
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: true,
			writable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(navigator, "onLine", {
			configurable: true,
			value: originalOnLine,
			writable: true,
		});
	});

	it("returns current online status and updates on window events", () => {
		const { result } = renderHook(() => useNetworkStatus());
		expect(result.current.isOnline).toBe(true);

		act(() => {
			Object.defineProperty(navigator, "onLine", {
				configurable: true,
				value: false,
				writable: true,
			});
			window.dispatchEvent(new Event("offline"));
		});
		expect(result.current.isOnline).toBe(false);

		act(() => {
			Object.defineProperty(navigator, "onLine", {
				configurable: true,
				value: true,
				writable: true,
			});
			window.dispatchEvent(new Event("online"));
		});
		expect(result.current.isOnline).toBe(true);
	});
});
