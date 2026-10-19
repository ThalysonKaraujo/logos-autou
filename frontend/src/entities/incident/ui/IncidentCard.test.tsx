import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Incident } from "../model/types";
import { IncidentCard } from "./IncidentCard";

describe("IncidentCard", () => {
	const mockIncident: Incident = {
		id: "inc-1",
		title: "Tombamento na BR-116",
		description: "Carreta tombou interditando pista",
		category: "Acidente com Veículo",
		criticality: "Alta",
		status: "Aberto",
		location: "BR-116, Km 340",
		truck_plate: "LOG0A10",
		driver_name: "Marcos Oliveira",
		assigned_to: "Mariana Silva",
		version: 1,
		created_at: "2026-10-12T12:00:00Z",
		updated_at: "2026-10-12T12:00:00Z",
	};

	it("renders incident details including formatted creation date", () => {
		const onSelect = vi.fn();
		render(
			<IncidentCard
				incident={mockIncident}
				isSelected={false}
				onSelect={onSelect}
			/>,
		);

		expect(screen.getByText("Tombamento na BR-116")).toBeInTheDocument();
		expect(screen.getByText("LOG0A10")).toBeInTheDocument();
		expect(screen.getByText(/12\/10\/2026/)).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button"));
		expect(onSelect).toHaveBeenCalledTimes(1);
	});
});
