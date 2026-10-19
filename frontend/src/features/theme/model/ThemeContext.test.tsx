import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

describe("ThemeContext", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove("dark");
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove("dark");
	});

	it("defaults to dark theme when no stored preference exists", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<ThemeProvider>{children}</ThemeProvider>
		);

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});

	it("initializes with stored theme from localStorage", () => {
		localStorage.setItem("logos_theme", "light");

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<ThemeProvider>{children}</ThemeProvider>
		);

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
	});

	it("toggles theme between dark and light and persists to localStorage", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<ThemeProvider>{children}</ThemeProvider>
		);

		const { result } = renderHook(() => useTheme(), { wrapper });

		expect(result.current.theme).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("light");
		expect(document.documentElement.classList.contains("dark")).toBe(false);
		expect(localStorage.getItem("logos_theme")).toBe("light");

		act(() => {
			result.current.toggleTheme();
		});

		expect(result.current.theme).toBe("dark");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
		expect(localStorage.getItem("logos_theme")).toBe("dark");
	});

	it("throws error when useTheme is used outside of ThemeProvider", () => {
		expect(() => {
			renderHook(() => useTheme());
		}).toThrow("useTheme must be used within a ThemeProvider");
	});
});
