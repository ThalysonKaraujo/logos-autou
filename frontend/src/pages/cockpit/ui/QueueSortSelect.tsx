import { ArrowUpDown, ChevronDown } from "lucide-react";
import type { IncidentSortBy } from "@/entities/incident/model/types";
import { QUEUE_SORT_OPTIONS } from "../model/constants";

export interface QueueSortSelectProps {
	value: IncidentSortBy;
	onChange: (value: IncidentSortBy) => void;
}

export function QueueSortSelect({ value, onChange }: QueueSortSelectProps) {
	const activeLabel =
		QUEUE_SORT_OPTIONS.find((opt) => opt.value === value)?.label ?? value;

	return (
		<div className="relative inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-zinc-600 rounded px-2 py-1 transition-colors cursor-pointer group shadow-2xs">
			<ArrowUpDown className="w-3 h-3 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 shrink-0 pointer-events-none" />
			<span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-zinc-100 pointer-events-none">
				{activeLabel}
			</span>
			<ChevronDown className="w-3 h-3 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0 pointer-events-none" />
			<select
				aria-label="Ordenar fila de triagem"
				value={value}
				onChange={(e) => onChange(e.target.value as IncidentSortBy)}
				className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
