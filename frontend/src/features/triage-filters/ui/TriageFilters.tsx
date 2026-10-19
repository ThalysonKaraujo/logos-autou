import {
	CATEGORY_OPTIONS,
	DATE_PRESET_OPTIONS,
	STATUS_OPTIONS,
} from "../model/triageFilter";
import {
	type TriageFiltersProps,
	useTriageFilters,
} from "../model/useTriageFilters";

export function TriageFilters(props: TriageFiltersProps) {
	const {
		search,
		onSearchChange,
		selectedCriticality,
		onCriticalityChange,
		selectedStatus,
		onResetFilters,
		counts,
	} = props;

	const {
		searchInputRef,
		selectedCategory,
		datePreset,
		dateFrom,
		dateTo,
		isFiltering,
		hasDateError,
		handleStatusSelect,
		handleCategorySelect,
		handlePresetSelect,
		handleDateFromChange,
		handleDateToChange,
	} = useTriageFilters(props);

	return (
		<div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg p-2.5 flex flex-col gap-2 shadow-xs transition-colors">
			<div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
				<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-[280px]">
					<div className="relative flex-1">
						<input
							ref={searchInputRef}
							type="text"
							value={search}
							onChange={(e) => onSearchChange(e.target.value)}
							placeholder="Buscar por placa, título ou rodovia... (/ para focar)"
							className="w-full bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
						/>
					</div>

					<div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#18181b] p-0.5 rounded border border-zinc-200 dark:border-[#27272a] shrink-0 overflow-x-auto">
						<button
							type="button"
							onClick={() => onCriticalityChange("ALL")}
							className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
								selectedCriticality === "ALL"
									? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-zinc-100 font-medium shadow-xs"
									: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
							}`}
						>
							<span>Todos</span>
							{counts !== undefined && (
								<span
									className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
										selectedCriticality === "ALL"
											? "bg-zinc-200 dark:bg-zinc-700/80 text-zinc-800 dark:text-zinc-200"
											: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
									}`}
								>
									{counts.all}
								</span>
							)}
						</button>

						<button
							type="button"
							onClick={() => onCriticalityChange("Alta")}
							className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
								selectedCriticality === "Alta"
									? "bg-white dark:bg-[#27272a] text-rose-600 dark:text-rose-300 font-medium shadow-xs"
									: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
							}`}
						>
							<span className="flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
								Alta
							</span>
							{counts !== undefined && (
								<span
									className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
										selectedCriticality === "Alta"
											? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/50"
											: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
									}`}
								>
									{counts.alta}
								</span>
							)}
						</button>

						<button
							type="button"
							onClick={() => onCriticalityChange("Média")}
							className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
								selectedCriticality === "Média"
									? "bg-white dark:bg-[#27272a] text-amber-600 dark:text-amber-300 font-medium shadow-xs"
									: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
							}`}
						>
							<span className="flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
								Média
							</span>
							{counts !== undefined && (
								<span
									className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
										selectedCriticality === "Média"
											? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50"
											: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
									}`}
								>
									{counts.media}
								</span>
							)}
						</button>

						<button
							type="button"
							onClick={() => onCriticalityChange("Baixa")}
							className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 flex items-center gap-1.5 ${
								selectedCriticality === "Baixa"
									? "bg-white dark:bg-[#27272a] text-emerald-600 dark:text-emerald-300 font-medium shadow-xs"
									: "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
							}`}
						>
							<span className="flex items-center gap-1">
								<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
								Baixa
							</span>
							{counts !== undefined && (
								<span
									className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
										selectedCriticality === "Baixa"
											? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50"
											: "bg-zinc-200/60 dark:bg-[#27272a]/60 text-zinc-600 dark:text-zinc-400"
									}`}
								>
									{counts.baixa}
								</span>
							)}
						</button>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 shrink-0">
					<select
						aria-label="Filtrar por categoria"
						value={selectedCategory}
						onChange={(e) => handleCategorySelect(e.target.value)}
						className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none cursor-pointer"
					>
						{CATEGORY_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<select
						aria-label="Filtrar por status"
						value={selectedStatus}
						onChange={(e) => handleStatusSelect(e.target.value)}
						className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-300 outline-none cursor-pointer"
					>
						{STATUS_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-100 dark:border-[#27272a]/60">
				<div className="flex flex-wrap items-center gap-2">
					<select
						aria-label="Filtrar por período"
						value={datePreset}
						onChange={(e) => handlePresetSelect(e.target.value)}
						className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-300 outline-none cursor-pointer"
					>
						{DATE_PRESET_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>

					<div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
						<span>De</span>
						<input
							aria-label="Data inicial"
							type="date"
							value={dateFrom}
							onChange={(e) => handleDateFromChange(e.target.value)}
							className={`bg-zinc-50 dark:bg-[#18181b] border rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-300 outline-none ${
								hasDateError
									? "border-rose-500 dark:border-rose-500"
									: "border-zinc-200 dark:border-[#27272a]"
							}`}
						/>
						<span>até</span>
						<input
							aria-label="Data final"
							type="date"
							value={dateTo}
							onChange={(e) => handleDateToChange(e.target.value)}
							className={`bg-zinc-50 dark:bg-[#18181b] border rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-300 outline-none ${
								hasDateError
									? "border-rose-500 dark:border-rose-500"
									: "border-zinc-200 dark:border-[#27272a]"
							}`}
						/>
					</div>

					{hasDateError && (
						<span className="text-[11px] text-rose-600 dark:text-rose-400">
							A data inicial não pode ser posterior à data final.
						</span>
					)}
				</div>

				{isFiltering && onResetFilters && (
					<button
						type="button"
						onClick={onResetFilters}
						className="px-2.5 py-1 rounded text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-[#18181b] hover:bg-zinc-200 dark:hover:bg-[#27272a] border border-zinc-200 dark:border-[#27272a] transition-colors"
					>
						Limpar filtros
					</button>
				)}
			</div>
		</div>
	);
}
