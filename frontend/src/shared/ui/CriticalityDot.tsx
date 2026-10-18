import type { IncidentCriticality } from "@/entities/incident/model/types";

export interface CriticalityDotProps {
	criticality: IncidentCriticality;
	className?: string;
}

export function CriticalityDot({
	criticality,
	className = "",
}: CriticalityDotProps) {
	const dotColor =
		criticality === "Alta"
			? "bg-red-500"
			: criticality === "Média"
				? "bg-amber-500"
				: "bg-zinc-500";

	return (
		<span
			role="status"
			aria-label={`Criticidade: ${criticality}`}
			title={`Criticidade: ${criticality}`}
			className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} ${className}`}
		/>
	);
}
