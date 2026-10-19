export interface PlateBadgeProps {
	plate: string;
	className?: string;
}

export function PlateBadge({ plate, className = "" }: PlateBadgeProps) {
	return (
		<span
			className={`font-mono text-xs font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 rounded border border-zinc-200 dark:border-[#27272a] tracking-wider uppercase inline-block ${className}`}
		>
			{plate.toUpperCase()}
		</span>
	);
}
