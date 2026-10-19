import { useOperator } from "@/features/operator-session";
import { ThemeToggle } from "@/features/theme";
import { useNetworkStatus } from "@/shared/lib";

export interface TopbarProps {
	onOpenNewIncident: () => void;
}

export function Topbar({ onOpenNewIncident }: TopbarProps) {
	const { operator, availableOperators, setOperator } = useOperator();
	const { isOnline } = useNetworkStatus();

	return (
		<header className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs transition-colors">
			<div className="flex items-center justify-between md:justify-start gap-3">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-xs tracking-wider text-zinc-900 dark:text-zinc-100">
						LOGOS
					</span>
					<span className="text-zinc-400 dark:text-zinc-600">/</span>
					<span className="text-zinc-500 dark:text-zinc-400 text-xs">
						Central de Incidentes
					</span>
				</div>

				<div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 dark:border-[#27272a]">
					<span
						role="status"
						aria-label={isOnline ? "Sistema conectado" : "Sem conexão de rede"}
						className={`w-1.5 h-1.5 rounded-full shrink-0 ${
							isOnline
								? "bg-emerald-500 animate-pulse"
								: "bg-amber-500 animate-ping"
						}`}
					/>
					<span
						className={`text-xs ${
							isOnline
								? "text-zinc-500 dark:text-zinc-400"
								: "text-amber-600 dark:text-amber-400 font-medium"
						}`}
					>
						{isOnline ? "Conectado" : "Sem conexão"}
					</span>
				</div>
			</div>

			<div className="flex items-center flex-wrap gap-2">
				<div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] px-2.5 py-1 rounded">
					<label
						htmlFor="operator-select"
						className="text-zinc-500 text-xs shrink-0"
					>
						Operador:
					</label>
					<select
						id="operator-select"
						value={operator}
						onChange={(e) => setOperator(e.target.value)}
						className="bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer font-medium"
					>
						{availableOperators.map((op) => (
							<option
								key={op}
								value={op}
								className="bg-white dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200"
							>
								{op}
							</option>
						))}
					</select>
				</div>

				<ThemeToggle />

				<button
					type="button"
					onClick={onOpenNewIncident}
					className="px-3 py-1 rounded text-xs font-medium bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white transition-colors"
				>
					+ Novo Chamado
				</button>
			</div>
		</header>
	);
}
