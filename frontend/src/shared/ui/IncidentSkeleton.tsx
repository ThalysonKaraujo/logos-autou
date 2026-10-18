import { useId } from "react";

export interface IncidentSkeletonProps {
	count?: number;
}

export function IncidentSkeleton({ count = 4 }: IncidentSkeletonProps) {
	const baseId = useId();
	const items = Array.from({ length: count }, (_, i) => `${baseId}-item-${i}`);

	return (
		<div className="space-y-2 w-full">
			{items.map((key) => (
				<div
					key={key}
					className="p-3 rounded border border-[#27272a] bg-[#121215] animate-pulse space-y-2"
				>
					<div className="flex items-center justify-between">
						<div className="h-4 w-20 bg-[#18181b] rounded" />
						<div className="h-3 w-12 bg-[#18181b] rounded" />
					</div>
					<div className="h-4 w-3/4 bg-[#18181b] rounded" />
					<div className="flex items-center justify-between pt-1">
						<div className="h-3 w-16 bg-[#18181b] rounded" />
						<div className="h-3 w-20 bg-[#18181b] rounded" />
					</div>
				</div>
			))}
		</div>
	);
}
