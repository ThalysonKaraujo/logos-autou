import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		const saved = localStorage.getItem("logos_theme");
		if (saved === "light" || saved === "dark") {
			return saved;
		}
		return "dark";
	});

	useEffect(() => {
		if (theme === "dark") {
			document.documentElement.classList.add("dark");
			document.documentElement.style.colorScheme = "dark";
		} else {
			document.documentElement.classList.remove("dark");
			document.documentElement.style.colorScheme = "light";
		}
		localStorage.setItem("logos_theme", theme);
	}, [theme]);

	const toggleTheme = () => {
		setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
	};

	const setTheme = (next: Theme) => {
		setThemeState(next);
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return context;
}
