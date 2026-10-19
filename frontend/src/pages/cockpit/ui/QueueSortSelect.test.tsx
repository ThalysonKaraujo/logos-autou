import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QueueSortSelect } from "./QueueSortSelect";

describe("QueueSortSelect", () => {
	it("renders sort selector with current value and allows selecting options", () => {
		const onChange = vi.fn();
		render(<QueueSortSelect value="criticality_desc" onChange={onChange} />);

		const select = screen.getByLabelText("Ordenar fila de triagem");
		expect(select).toBeInTheDocument();
		expect(select).toHaveValue("criticality_desc");
		expect(screen.getAllByText("Prioridade: Alta > Baixa")).toHaveLength(2);

		fireEvent.change(select, { target: { value: "created_at_desc" } });
		expect(onChange).toHaveBeenCalledWith("created_at_desc");
	});
});
