import type { IncidentStatus } from "@/entities/incident/model/types";

export interface StatusBadgeProps {
	status: IncidentStatus;
	className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
	return (
		<span
			className={`text-xs text-zinc-400 font-medium inline-block ${className}`}
		>
			{status}
		</span>
	);
}
