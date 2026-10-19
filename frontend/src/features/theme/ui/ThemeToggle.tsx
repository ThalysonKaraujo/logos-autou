import { Moon, Sun } from "lucide-react";
import { useTheme } from "../model/ThemeContext";

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();

	return (
		<button
			type="button"
			onClick={toggleTheme}
			aria-label={
				theme === "dark"
					? "Alternar para tema claro"
					: "Alternar para tema escuro"
			}
			className="group flex items-center justify-center w-7 h-7 rounded border border-zinc-200 dark:border-[#27272a] bg-zinc-100 dark:bg-[#18181b] hover:bg-zinc-200 dark:hover:bg-[#27272a] transition-colors"
		>
			{theme === "dark" ? (
				<Sun className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-300 transition-colors" />
			) : (
				<Moon className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
			)}
		</button>
	);
}
