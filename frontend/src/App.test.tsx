import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
	it("renders application title and cockpit header", () => {
		render(<App />);
		expect(screen.getByText("LOGOS")).toBeInTheDocument();
		expect(screen.getByText("Central de Incidentes")).toBeInTheDocument();
	});
});
