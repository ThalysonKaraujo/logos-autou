import type { Incident } from "@/entities/incident/model/types";
import { CriticalityDot, PlateBadge, StatusBadge } from "@/shared/ui";

export interface IncidentCardProps {
	incident: Incident;
	isSelected: boolean;
	onSelect: () => void;
}

const formatRelativeTime = (isoString: string): string => {
	try {
		const diff = Date.now() - new Date(isoString).getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return "Agora";
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		return `${days}d`;
	} catch {
		return "Recente";
	}
};

export function IncidentCard({
	incident,
	isSelected,
	onSelect,
}: IncidentCardProps) {
	const timeAgo = formatRelativeTime(incident.created_at);

	return (
		<button
			type="button"
			onClick={onSelect}
			className={`p-3 rounded border transition-colors cursor-pointer w-full text-left outline-none block ${
				isSelected
					? "border-zinc-400 dark:border-zinc-500 bg-zinc-100 dark:bg-[#18181b]"
					: "border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#121215] hover:border-zinc-300 dark:hover:border-zinc-700"
			}`}
		>
			<div className="flex items-center justify-between mb-1.5 gap-2">
				<div className="flex items-center gap-2">
					<CriticalityDot criticality={incident.criticality} />
					<PlateBadge plate={incident.truck_plate} />
					<span
						className={`text-xs hidden sm:inline font-medium ${
							incident.criticality === "Alta"
								? "text-rose-600 dark:text-rose-400"
								: incident.criticality === "Média"
									? "text-amber-600 dark:text-amber-400"
									: "text-emerald-600 dark:text-emerald-400"
						}`}
					>
						{incident.criticality}
					</span>
				</div>
				<span className="font-mono text-xs text-zinc-500 shrink-0">
					{timeAgo}
				</span>
			</div>

			<p className="text-xs text-zinc-900 dark:text-zinc-200 font-medium truncate leading-snug">
				{incident.title}
			</p>

			<div className="flex items-center justify-between text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-100 dark:border-[#27272a]/60 gap-2">
				<StatusBadge status={incident.status} />
				<div className="flex items-center gap-2 shrink-0">
					<span className="truncate max-w-[120px] text-zinc-600 dark:text-zinc-400">
						{incident.assigned_to || "Sem analista"}
					</span>
					<span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
						v{incident.version}
					</span>
				</div>
			</div>
		</button>
	);
}
