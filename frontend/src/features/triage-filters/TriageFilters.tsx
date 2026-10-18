import { useEffect, useRef } from "react";
import type {
	IncidentCriticality,
	IncidentStatus,
} from "@/entities/incident/model/types";

export interface TriageFiltersProps {
	search: string;
	onSearchChange: (search: string) => void;
	selectedCriticality: IncidentCriticality | "ALL";
	onCriticalityChange: (crit: IncidentCriticality | "ALL") => void;
	selectedStatus: IncidentStatus | "ALL";
	onStatusChange: (status: IncidentStatus | "ALL") => void;
}

export function TriageFilters({
	search,
	onSearchChange,
	selectedCriticality,
	onCriticalityChange,
	selectedStatus,
	onStatusChange,
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
		<div className="bg-[#121215] border border-[#27272a] rounded-lg p-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shadow-xs">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-[280px]">
				<div className="relative flex-1">
					<input
						ref={searchInputRef}
						type="text"
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder="Buscar por placa, título ou rodovia... (/ para focar)"
						className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
					/>
				</div>

				<div className="flex items-center gap-1 bg-[#18181b] p-0.5 rounded border border-[#27272a] shrink-0 overflow-x-auto">
					<button
						type="button"
						onClick={() => onCriticalityChange("ALL")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
							selectedCriticality === "ALL"
								? "bg-[#27272a] text-zinc-100 font-medium shadow-xs"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						Todos
					</button>
					<button
						type="button"
						onClick={() => onCriticalityChange("Alta")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
							selectedCriticality === "Alta"
								? "bg-[#27272a] text-zinc-100 font-medium shadow-xs"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						Alta
					</button>
					<button
						type="button"
						onClick={() => onCriticalityChange("Média")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
							selectedCriticality === "Média"
								? "bg-[#27272a] text-zinc-100 font-medium shadow-xs"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						Média
					</button>
					<button
						type="button"
						onClick={() => onCriticalityChange("Baixa")}
						className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
							selectedCriticality === "Baixa"
								? "bg-[#27272a] text-zinc-100 font-medium shadow-xs"
								: "text-zinc-400 hover:text-zinc-200"
						}`}
					>
						Baixa
					</button>
				</div>
			</div>

			<div className="flex items-center gap-2 shrink-0">
				<select
					value={selectedStatus}
					onChange={(e) =>
						onStatusChange(e.target.value as IncidentStatus | "ALL")
					}
					className="w-full sm:w-auto bg-[#18181b] border border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
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
