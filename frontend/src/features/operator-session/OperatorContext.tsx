import type React from "react";
import { createContext, useContext, useState } from "react";

export const AVAILABLE_OPERATORS = [
	"Carlos Mendes",
	"Fernanda Costa",
	"Rafael Souza",
] as const;

export interface OperatorContextValue {
	operator: string;
	availableOperators: readonly string[];
	setOperator: (name: string) => void;
}

const OperatorContext = createContext<OperatorContextValue | null>(null);

const STORAGE_KEY = "logos_operator";

export function OperatorProvider({ children }: { children: React.ReactNode }) {
	const [operator, setOperatorState] = useState<string>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				return saved;
			}
		}
		return AVAILABLE_OPERATORS[0];
	});

	const setOperator = (name: string) => {
		setOperatorState(name);
		if (typeof window !== "undefined") {
			localStorage.setItem(STORAGE_KEY, name);
		}
	};

	return (
		<OperatorContext.Provider
			value={{
				operator,
				availableOperators: AVAILABLE_OPERATORS,
				setOperator,
			}}
		>
			{children}
		</OperatorContext.Provider>
	);
}

export function useOperator(): OperatorContextValue {
	const context = useContext(OperatorContext);
	if (!context) {
		throw new Error("useOperator must be used within an OperatorProvider");
	}
	return context;
}
