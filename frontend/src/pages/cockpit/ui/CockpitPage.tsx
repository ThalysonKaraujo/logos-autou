import { DetailPanel, IncidentList } from "@/entities/incident/ui";
import { CreateIncidentModal } from "@/features/create-incident";
import { EditIncidentModal } from "@/features/edit-incident";
import { TriageFilters } from "@/features/triage-filters";
import { NotificationToast } from "@/shared/ui";
import { Topbar } from "@/widgets/topbar";
import { useCockpitState } from "../model/useCockpitState";
import { ConflictBanner } from "./ConflictBanner";
import { ConflictModal } from "./ConflictModal";
import { QueueSortSelect } from "./QueueSortSelect";

export function CockpitPage() {
	const {
		selectedId,
		setSelectedId,
		clearSelectedIncident,
		search,
		handleSearchChange,
		criticality,
		handleCriticalityChange,
		status,
		handleStatusChange,
		category,
		handleCategoryChange,
		datePreset,
		handleDatePresetChange,
		dateFrom,
		dateTo,
		handleDateRangeChange,
		sortBy,
		handleSortByChange,
		handleResetFilters,
		counts,
		filters,
		total,
		page,
		totalPages,
		pageSize,
		nextPage,
		prevPage,
		occConflictTraceId,
		activeConflict,
		handleConflictDetected,
		dismissConflict,
		handleReloadLatest,
		notification,
		dismissNotification,
		isCreateModalOpen,
		openCreateModal,
		closeCreateModal,
		handleCreateSuccess,
		editingIncident,
		openEditModal,
		closeEditModal,
	} = useCockpitState();

	return (
		<div className="min-h-screen lg:h-screen lg:max-h-screen bg-zinc-100 dark:bg-[#09090b] text-zinc-900 dark:text-[#f4f4f5] p-3 sm:p-4 flex flex-col gap-2.5 font-sans lg:overflow-hidden transition-colors">
			<Topbar onOpenNewIncident={openCreateModal} />

			<ConflictBanner
				traceId={occConflictTraceId}
				onDismiss={dismissConflict}
			/>

			<TriageFilters
				search={search}
				onSearchChange={handleSearchChange}
				selectedCriticality={criticality}
				onCriticalityChange={handleCriticalityChange}
				selectedStatus={status}
				onStatusChange={handleStatusChange}
				selectedCategory={category}
				onCategoryChange={handleCategoryChange}
				datePreset={datePreset}
				onDatePresetChange={handleDatePresetChange}
				dateFrom={dateFrom}
				dateTo={dateTo}
				onDateRangeChange={handleDateRangeChange}
				onResetFilters={handleResetFilters}
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
						<QueueSortSelect value={sortBy} onChange={handleSortByChange} />
					</div>

					<div className="flex-1 overflow-y-auto p-1.5">
						<IncidentList
							selectedId={selectedId}
							onSelect={setSelectedId}
							filters={filters}
						/>
					</div>

					<div className="px-3 py-2 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#121215] flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
						<span className="font-mono text-[11px] text-zinc-500">
							{total > 0
								? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total}`
								: "0 chamados"}
						</span>
						<div className="flex items-center gap-1.5">
							<button
								type="button"
								disabled={page <= 1}
								onClick={prevPage}
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
								onClick={nextPage}
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
						onBackToList={clearSelectedIncident}
						onConflictDetected={handleConflictDetected}
						onEditIncident={openEditModal}
					/>
				</section>
			</main>

			<CreateIncidentModal
				isOpen={isCreateModalOpen}
				onClose={closeCreateModal}
				onSuccess={handleCreateSuccess}
			/>

			<EditIncidentModal
				incident={editingIncident}
				isOpen={Boolean(editingIncident)}
				onClose={closeEditModal}
				onConflictDetected={handleConflictDetected}
			/>

			<ConflictModal
				isOpen={Boolean(activeConflict)}
				onClose={dismissConflict}
				onReloadLatest={handleReloadLatest}
				traceId={activeConflict?.traceId}
				expectedVersion={activeConflict?.expectedVersion}
				currentVersion={activeConflict?.currentVersion}
				serverState={activeConflict?.serverState}
				attemptedState={activeConflict?.attemptedState}
			/>

			{notification && (
				<NotificationToast
					type={notification.type}
					title={notification.title}
					message={notification.message}
					onClose={dismissNotification}
				/>
			)}
		</div>
	);
}
