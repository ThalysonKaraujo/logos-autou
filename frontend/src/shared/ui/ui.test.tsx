import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CriticalityDot } from "./CriticalityDot";
import { IncidentSkeleton } from "./IncidentSkeleton";
import { PlateBadge } from "./PlateBadge";
import { StatusBadge } from "./StatusBadge";

describe("Shared UI Components", () => {
	describe("CriticalityDot", () => {
		it("renders red dot for Alta criticality", () => {
			const { container } = render(<CriticalityDot criticality="Alta" />);
			const dot = container.querySelector("span");
			expect(dot).toBeInTheDocument();
			expect(dot?.className).toContain("bg-red-500");
		});

		it("renders amber dot for Média criticality", () => {
			const { container } = render(<CriticalityDot criticality="Média" />);
			const dot = container.querySelector("span");
			expect(dot).toBeInTheDocument();
			expect(dot?.className).toContain("bg-amber-500");
		});

		it("renders zinc dot for Baixa criticality", () => {
			const { container } = render(<CriticalityDot criticality="Baixa" />);
			const dot = container.querySelector("span");
			expect(dot).toBeInTheDocument();
			expect(dot?.className).toContain("bg-zinc-500");
		});
	});

	describe("PlateBadge", () => {
		it("renders uppercase formatted license plate", () => {
			render(<PlateBadge plate="log0a10" />);
			expect(screen.getByText("LOG0A10")).toBeInTheDocument();
		});
	});

	describe("StatusBadge", () => {
		it("renders status text correctly", () => {
			render(<StatusBadge status="Em Investigação" />);
			expect(screen.getByText("Em Investigação")).toBeInTheDocument();
		});
	});

	describe("IncidentSkeleton", () => {
		it("renders multiple animated skeleton lines", () => {
			const { container } = render(<IncidentSkeleton count={3} />);
			const skeletons = container.querySelectorAll(".animate-pulse");
			expect(skeletons.length).toBeGreaterThanOrEqual(3);
		});
	});
});
