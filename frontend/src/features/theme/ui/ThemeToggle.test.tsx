import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "../model/ThemeContext";
import { ThemeToggle } from "./ThemeToggle";

describe("ThemeToggle", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove("dark");
	});

	it("renders toggle button with accessible label", () => {
		render(
			<ThemeProvider>
				<ThemeToggle />
			</ThemeProvider>,
		);

		const button = screen.getByRole("button", {
			name: /alternar para tema claro/i,
		});
		expect(button).toBeInTheDocument();
	});

	it("switches theme and updates accessible label on click", () => {
		render(
			<ThemeProvider>
				<ThemeToggle />
			</ThemeProvider>,
		);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-label", "Alternar para tema claro");

		fireEvent.click(button);

		expect(button).toHaveAttribute("aria-label", "Alternar para tema escuro");
		expect(document.documentElement.classList.contains("dark")).toBe(false);

		fireEvent.click(button);

		expect(button).toHaveAttribute("aria-label", "Alternar para tema claro");
		expect(document.documentElement.classList.contains("dark")).toBe(true);
	});
});
