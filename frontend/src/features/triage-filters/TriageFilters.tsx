import { useEffect, useRef } from "react";
import type {
	IncidentCriticality,
	IncidentStatus,
} from "@/entities/incident/model/types";

export interface CriticalityCounts {
	all: number;
	alta: number;
	media: number;
	baixa: number;
}

export interface TriageFiltersProps {
	search: string;
	onSearchChange: (search: string) => void;
	selectedCriticality: IncidentCriticality | "ALL";
	onCriticalityChange: (crit: IncidentCriticality | "ALL") => void;
	selectedStatus: IncidentStatus | "ALL";
	onStatusChange: (status: IncidentStatus | "ALL") => void;
	counts?: CriticalityCounts;
}

export function TriageFilters({
	search,
	onSearchChange,
	selectedCriticality,
	onCriticalityChange,
	selectedStatus,
	onStatusChange,
	counts,
}: TriageFiltersProps) {
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "/" && document.activeElement !== searchInputRef.current) {
				e.preventDefault();
				searchInputRef.current?.focus();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-xs transition-colors">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-[280px]">
				<div className="relative flex-1">
					<input
						ref={searchInputRef}
						type="text"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Buscar por placa, título ou rodovia... (/ para focar)"
						className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
					/>
				</div>

				<div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181b] p-0.5 rounded border border-zinc-200 dark:border-[#27272a] shrink-0 overflow-x-auto">
					<button
						type="button"
						onClick={() => onCriticalityChange("ALL")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
							selectedCriticality === "ALL"
								? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-zinc-100 font-medium shadow-xs"
								: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
						}`}
					>
						<span>Todos</span>
						{counts !== undefined && (
							<span
								className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
									selectedCriticality === "ALL"
										? "bg-zinc-200 dark:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200"
										: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
								}`}
							>
								{counts.all}
							</span>
						)}
					</button>

					<button
						type="button"
						onClick={() => onCriticalityChange("Alta")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
							selectedCriticality === "Alta"
								? "bg-white dark:bg-[#27272a] text-rose-600 dark:text-rose-300 font-medium shadow-xs"
								: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
						}`}
					>
						<span className="flex items-center gap-1">
							<span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
							Alta
						</span>
						{counts !== undefined && (
							<span
								className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
									selectedCriticality === "Alta"
										? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50"
										: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
								}`}
							>
								{counts.alta}
							</span>
						)}
					</button>

					<button
						type="button"
						onClick={() => onCriticalityChange("Média")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
							selectedCriticality === "Média"
								? "bg-white dark:bg-[#27272a] text-amber-600 dark:text-amber-300 font-medium shadow-xs"
								: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
						}`}
					>
						<span className="flex items-center gap-1">
							<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
							Média
						</span>
						{counts !== undefined && (
							<span
								className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
									selectedCriticality === "Média"
										? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50"
										: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
								}`}
							>
								{counts.media}
							</span>
						)}
					</button>

					<button
						type="button"
						onClick={() => onCriticalityChange("Baixa")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
							selectedCriticality === "Baixa"
								? "bg-white dark:bg-[#27272a] text-emerald-600 dark:text-emerald-300 font-medium shadow-xs"
								: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
						}`}
					>
						<span className="flex items-center gap-1">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
							Baixa
						</span>
						{counts !== undefined && (
							<span
								className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
									selectedCriticality === "Baixa"
										? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50"
										: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
								}`}
							>
								{counts.baixa}
							</span>
						)}
					</button>
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<select
					value={selectedStatus}
					onChange={(e) =>
						onStatusChange(e.target.value as IncidentStatus | "ALL")
					}
					className="w-full sm:w-auto bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none cursor-pointer"
				>
					<option value="ALL">Status: Todos</option>
					<option value="Aberto">Aberto</option>
					<option value="Em Investigação">Em Investigação</option>
					<option value="Fechado">Fechado</option>
					<option value="Inconclusivo">Inconclusivo</option>
				</select>
			</div>
		</div>
	);
}
