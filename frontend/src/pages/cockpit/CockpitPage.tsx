import { useMemo, useState } from "react";
import { useIncidents } from "@/entities/incident/api";
import type {
	IncidentCriticality,
	IncidentFilters,
	IncidentStatus,
} from "@/entities/incident/model/types";
import { DetailPanel, IncidentList } from "@/entities/incident/ui";
import { CreateIncidentModal } from "@/features/create-incident";
import { TriageFilters } from "@/features/triage-filters";
import { Topbar } from "@/widgets/topbar";

export function CockpitPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [criticality, setCriticality] = useState<IncidentCriticality | "ALL">(
		"ALL",
	);
	const [status, setStatus] = useState<IncidentStatus | "ALL">("ALL");
	const [occConflictTraceId, setOccConflictTraceId] = useState<string | null>(
		null,
	);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

	const baseFilters: IncidentFilters = useMemo(() => {
		const f: IncidentFilters = { limit: 100 };
		if (status !== "ALL") f.status = status;
		if (search.trim()) f.search = search.trim();
		return f;
	}, [status, search]);

	const { data: baseIncidents } = useIncidents(baseFilters);

	const counts = useMemo(() => {
		const items = baseIncidents?.items || [];
		return {
			all: baseIncidents?.total ?? items.length,
			alta: items.filter((i) => i.criticality === "Alta").length,
			media: items.filter((i) => i.criticality === "Média").length,
			baixa: items.filter((i) => i.criticality === "Baixa").length,
		};
	}, [baseIncidents]);

	const filters: IncidentFilters = useMemo(() => {
		const f: IncidentFilters = { limit: 100 };
		if (criticality !== "ALL") f.criticality = criticality;
		if (status !== "ALL") f.status = status;
		if (search.trim()) f.search = search.trim();
		return f;
	}, [criticality, status, search]);

	return (
		<div className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-3 sm:p-4 flex flex-col gap-2.5 font-sans">
			<Topbar
				onOpenNewIncident={() => setIsCreateModalOpen(true)}
				onSimulateOCC={() => {
					setOccConflictTraceId("occ-simulated-9842a1b");
				}}
			/>

			{occConflictTraceId && (
				<div className="bg-[#18181b] border border-amber-900/60 rounded-lg p-3 flex items-start justify-between gap-3 shadow-sm animate-fade-in">
					<div className="flex items-start gap-2.5">
						<span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
						<div>
							<div className="flex items-center gap-2">
								<span className="font-semibold text-xs text-amber-200">
									Conflito de Concorrência Detectado (409)
								</span>
								<span className="font-mono text-xs text-zinc-500">
									X-Request-ID: {occConflictTraceId}
								</span>
							</div>
							<p className="text-xs text-zinc-400 mt-0.5">
								Este incidente foi alterado por outro operador simultaneamente.
								Os dados foram sincronizados automaticamente com o estado mais
								recente.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => setOccConflictTraceId(null)}
						className="text-xs text-zinc-500 hover:text-zinc-300 px-1 py-0.5 font-medium"
					>
						Dispensar
					</button>
				</div>
			)}

			<TriageFilters
				search={search}
				onSearchChange={setSearch}
				selectedCriticality={criticality}
				onCriticalityChange={setCriticality}
				selectedStatus={status}
				onStatusChange={setStatus}
				counts={counts}
			/>

			<main className="flex-1 flex gap-2.5 min-h-[560px]">
				<section
					className={`w-full lg:w-[430px] shrink-0 bg-[#121215] border border-[#27272a] rounded-lg flex flex-col overflow-hidden ${
						selectedId ? "hidden lg:flex" : "flex"
					}`}
				>
					<div className="px-3 py-2 border-b border-[#27272a] flex items-center justify-between text-zinc-400">
						<span className="font-medium text-xs text-zinc-300">
							Fila de Triagem
						</span>
						<span className="font-mono text-xs text-zinc-500">
							Ordem: Alta &gt; Média &gt; Baixa
						</span>
					</div>

					<div className="flex-1 overflow-y-auto p-1.5">
						<IncidentList
							selectedId={selectedId}
							onSelect={(id) => setSelectedId(id)}
							filters={filters}
						/>
					</div>
				</section>

				<section
					className={`flex-1 ${selectedId ? "flex" : "hidden lg:flex"} min-w-0`}
				>
					<DetailPanel
						incidentId={selectedId}
						onBackToList={() => setSelectedId(null)}
						onConflictDetected={(traceId) =>
							setOccConflictTraceId(traceId || "occ-detected")
						}
					/>
				</section>
			</main>

			<CreateIncidentModal
				isOpen={isCreateModalOpen}
				onClose={() => setIsCreateModalOpen(false)}
				onSuccess={(incident) => {
					setSelectedId(incident.id);
					setIsCreateModalOpen(false);
				}}
			/>
		</div>
	);
}
