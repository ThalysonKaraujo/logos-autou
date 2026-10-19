import { ArrowUpDown } from "lucide-react";
import type { IncidentSortBy } from "@/entities/incident/model/types";
import { QUEUE_SORT_OPTIONS } from "../model/constants";

export interface QueueSortSelectProps {
	value: IncidentSortBy;
	onChange: (value: IncidentSortBy) => void;
}

export function QueueSortSelect({ value, onChange }: QueueSortSelectProps) {
	return (
		<div className="relative inline-flex items-center gap-1">
			<ArrowUpDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0 pointer-events-none" />
			<select
				aria-label="Ordenar fila de triagem"
				value={value}
				onChange={(e) => onChange(e.target.value as IncidentSortBy)}
				className="bg-transparent hover:bg-zinc-100 dark:hover:bg-[#18181b] border-none text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 rounded px-1 py-0.5 outline-none cursor-pointer transition-colors"
			>
				{QUEUE_SORT_OPTIONS.map((option) => (
					<option
						key={option.value}
						value={option.value}
						className="bg-white dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200"
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
}
