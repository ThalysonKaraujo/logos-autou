import { useIncidents } from "@/entities/incident/api";
import type { IncidentFilters } from "@/entities/incident/model/types";
import { IncidentSkeleton } from "@/shared/ui";
import { IncidentCard } from "./IncidentCard";

export interface IncidentListProps {
	selectedId: string | null;
	onSelect: (id: string) => void;
	filters: IncidentFilters;
}

export function IncidentList({
	selectedId,
	onSelect,
	filters,
}: IncidentListProps) {
	const { data, isLoading, isError, isPlaceholderData, refetch } =
		useIncidents(filters);

	if (isLoading) {
		return <IncidentSkeleton count={5} />;
	}

	if (isError) {
		return (
			<div className="p-4 rounded border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-center space-y-2">
				<p className="text-xs text-red-600 dark:text-red-400">
					Erro ao carregar lista de chamados.
				</p>
				<button
					type="button"
					onClick={() => refetch()}
					className="px-2.5 py-1 rounded text-xs bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
				>
					Tentar novamente
				</button>
			</div>
		);
	}

	const items = data?.items || [];

	if (items.length === 0) {
		return (
			<div className="p-8 text-center text-zinc-500 text-xs border border-zinc-200 dark:border-[#27272a] rounded bg-white dark:bg-[#121215]">
				Nenhum chamado encontrado para os filtros selecionados.
			</div>
		);
	}

	return (
		<div
			className={`space-y-1.5 w-full transition-opacity duration-150 ${
				isPlaceholderData ? "opacity-60 pointer-events-none" : "opacity-100"
			}`}
		>
			{items.map((incident) => (
				<IncidentCard
					key={incident.id}
					incident={incident}
					isSelected={incident.id === selectedId}
					onSelect={() => onSelect(incident.id)}
				/>
			))}
		</div>
	);
}
