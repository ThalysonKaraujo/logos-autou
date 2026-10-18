import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	AVAILABLE_OPERATORS,
	OperatorProvider,
	useOperator,
} from "./OperatorContext";

describe("OperatorContext", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("throws error when used outside of OperatorProvider", () => {
		expect(() => renderHook(() => useOperator())).toThrow(
			"useOperator must be used within an OperatorProvider",
		);
	});

	it("provides default operator and available operator list", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<OperatorProvider>{children}</OperatorProvider>
		);

		const { result } = renderHook(() => useOperator(), { wrapper });

		expect(result.current.operator).toBe("Carlos Mendes");
		expect(result.current.availableOperators).toEqual(AVAILABLE_OPERATORS);
	});

	it("initializes operator from localStorage if available", () => {
		localStorage.setItem("logos_operator", "Fernanda Costa");

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<OperatorProvider>{children}</OperatorProvider>
		);

		const { result } = renderHook(() => useOperator(), { wrapper });

		expect(result.current.operator).toBe("Fernanda Costa");
	});

	it("updates operator and persists selection to localStorage", () => {
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<OperatorProvider>{children}</OperatorProvider>
		);

		const { result } = renderHook(() => useOperator(), { wrapper });

		act(() => {
			result.current.setOperator("Rafael Souza");
		});

		expect(result.current.operator).toBe("Rafael Souza");
		expect(localStorage.getItem("logos_operator")).toBe("Rafael Souza");
	});
});
