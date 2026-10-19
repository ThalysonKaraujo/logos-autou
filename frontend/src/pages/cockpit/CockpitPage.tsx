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

const PAGE_SIZE = 10;

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
	const [page, setPage] = useState(1);

	const handleSearchChange = (val: string) => {
		setSearch(val);
		setPage(1);
	};

	const handleCriticalityChange = (crit: IncidentCriticality | "ALL") => {
		setCriticality(crit);
		setPage(1);
	};

	const handleStatusChange = (st: IncidentStatus | "ALL") => {
		setStatus(st);
		setPage(1);
	};

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
		const f: IncidentFilters = {
			skip: (page - 1) * PAGE_SIZE,
			limit: PAGE_SIZE,
		};
		if (criticality !== "ALL") f.criticality = criticality;
		if (status !== "ALL") f.status = status;
		if (search.trim()) f.search = search.trim();
		return f;
	}, [criticality, status, search, page]);

	const { data: listData } = useIncidents(filters);
	const total = listData?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return (
		<div className="min-h-screen lg:h-screen lg:max-h-screen bg-zinc-100 dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] p-3 sm:p-4 flex flex-col gap-2.5 font-sans lg:overflow-hidden transition-colors">
			<Topbar onOpenNewIncident={() => setIsCreateModalOpen(true)} />

			{occConflictTraceId && (
				<div className="bg-amber-50 dark:bg-[#18181b] border border-amber-300 dark:border-amber-900/60 rounded-lg p-3 flex items-start justify-between gap-3 shadow-xs animate-fade-in">
					<div className="flex items-start gap-2.5">
						<span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
						<div>
							<div className="flex items-center gap-2">
								<span className="font-semibold text-xs text-amber-900 dark:text-amber-200">
									Conflito de Concorrência Detectado (409)
								</span>
								<span className="font-mono text-xs text-amber-700/80 dark:text-zinc-500">
									X-Request-ID: {occConflictTraceId}
								</span>
							</div>
							<p className="text-xs text-amber-800 dark:text-zinc-400 mt-0.5">
								Este incidente foi alterado por outro operador simultaneamente.
								Os dados foram sincronizados automaticamente com o estado mais
								recente.
							</p>
						</div>
					</div>
					<button
						type="button"
						onClick={() => setOccConflictTraceId(null)}
						className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 px-1 py-0.5 font-medium transition-colors"
					>
						Dispensar
					</button>
				</div>
			)}

			<TriageFilters
				search={search}
				onSearchChange={handleSearchChange}
				selectedCriticality={criticality}
				onCriticalityChange={handleCriticalityChange}
				selectedStatus={status}
				onStatusChange={handleStatusChange}
				counts={counts}
			/>

			<main className="flex-1 flex gap-2.5 min-h-0 lg:overflow-hidden">
				<section
					className={`w-full lg:w-[40%] lg:min-w-[380px] shrink-0 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg flex flex-col overflow-hidden h-full shadow-xs transition-colors ${
						selectedId ? "hidden lg:flex" : "flex"
					}`}
				>
					<div className="px-3 py-2 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between text-zinc-500 dark:text-zinc-400 shrink-0">
						<span className="font-medium text-xs text-zinc-800 dark:text-zinc-300">
							Fila de Triagem
						</span>
						<span className="font-mono text-xs text-zinc-400 dark:text-zinc-500">
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

					<div className="px-3 py-2 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#121215] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
						<span className="font-mono text-[11px] text-zinc-500">
							{total > 0
								? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} de ${total}`
								: "0 chamados"}
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="px-2 py-1 rounded bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 text-[11px] transition-colors"
							>
								← Anterior
							</button>
							<span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
								{page}/{totalPages}
							</span>
							<button
								type="button"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								className="px-2 py-1 rounded bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 text-[11px] transition-colors"
							>
								Próxima →
							</button>
						</div>
					</div>
				</section>

				<section
					className={`flex-1 ${selectedId ? "flex flex-col" : "hidden lg:flex lg:flex-col"} min-w-0 h-full overflow-hidden`}
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
