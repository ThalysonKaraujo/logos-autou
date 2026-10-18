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
	const { data, isLoading, isError, refetch } = useIncidents(filters);

	if (isLoading) {
		return <IncidentSkeleton count={5} />;
	}

	if (isError) {
		return (
			<div className="p-4 rounded border border-red-900/40 bg-red-950/20 text-center space-y-2">
				<p className="text-xs text-red-400">
					Erro ao carregar lista de chamados.
				</p>
				<button
					type="button"
					onClick={() => refetch()}
					className="px-2.5 py-1 rounded text-xs bg-[#18181b] border border-[#27272a] text-zinc-300 hover:text-zinc-100"
				>
					Tentar novamente
				</button>
			</div>
		);
	}

	const items = data?.items || [];

	if (items.length === 0) {
		return (
			<div className="p-8 text-center text-zinc-500 text-xs border border-[#27272a] rounded bg-[#121215]">
				Nenhum chamado encontrado para os filtros selecionados.
			</div>
		);
	}

	return (
		<div className="space-y-1.5 w-full">
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
