import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConflictBanner } from "./ConflictBanner";

describe("ConflictBanner", () => {
	it("renders nothing when traceId is null", () => {
		const { container } = render(
			<ConflictBanner traceId={null} onDismiss={() => {}} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders conflict warning and trace ID when traceId is present", () => {
		const onDismiss = vi.fn();
		render(<ConflictBanner traceId="trace-test-456" onDismiss={onDismiss} />);

		expect(
			screen.getByText("Conflito de Concorrência Detectado (409)"),
		).toBeInTheDocument();
		expect(
			screen.getByText("X-Request-ID: trace-test-456"),
		).toBeInTheDocument();

		fireEvent.click(screen.getByText("Dispensar"));
		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
});
