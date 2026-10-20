import { useState } from "react";

export interface ConflictDiffRow {
	label: string;
	attempted: string;
	server: string;
	changed: boolean;
}

export interface ConflictModalProps {
	isOpen: boolean;
	onClose: () => void;
	traceId?: string | null;
	expectedVersion?: number | null;
	currentVersion?: number | null;
	serverState?: {
		id?: string;
		title?: string;
		description?: string;
		category?: string;
		criticality?: string;
		status?: string;
		location?: string;
		truck_plate?: string;
		driver_name?: string | null;
		assigned_to?: string | null;
		version?: number;
		updated_at?: string;
	} | null;
	attemptedState?: {
		title?: string;
		description?: string;
		category?: string;
		criticality?: string;
		status?: string;
		location?: string;
		truck_plate?: string;
		driver_name?: string | null;
		notes?: string | null;
	} | null;
	onReloadLatest?: () => void;
}

export function buildConflictDiffRows(
	expectedVersion?: number | null,
	currentVersion?: number | null,
	serverState?: ConflictModalProps["serverState"],
	attemptedState?: ConflictModalProps["attemptedState"],
): ConflictDiffRow[] {
	const rows: ConflictDiffRow[] = [];

	if (attemptedState?.status || serverState?.status) {
		const attemptedStatus = attemptedState?.status || "—";
		const serverStatus = serverState?.status || "—";
		rows.push({
			label: "Status",
			attempted: attemptedStatus,
			server: serverStatus,
			changed: attemptedStatus !== serverStatus,
		});
	}

	const expV =
		expectedVersion !== undefined && expectedVersion !== null
			? `v${expectedVersion}`
			: "—";
	const curV =
		currentVersion !== undefined && currentVersion !== null
			? `v${currentVersion}`
			: serverState?.version !== undefined
				? `v${serverState.version}`
				: "—";
	rows.push({
		label: "Versão",
		attempted: expV,
		server: curV,
		changed: expV !== curV,
	});

	if (serverState?.assigned_to) {
		rows.push({
			label: "Analista Responsável",
			attempted: "—",
			server: serverState.assigned_to,
			changed: true,
		});
	}

	if (
		attemptedState?.title &&
		serverState?.title &&
		attemptedState.title !== serverState.title
	) {
		rows.push({
			label: "Título",
			attempted: attemptedState.title,
			server: serverState.title,
			changed: true,
		});
	}

	if (
		attemptedState?.criticality &&
		serverState?.criticality &&
		attemptedState.criticality !== serverState.criticality
	) {
		rows.push({
			label: "Criticidade",
			attempted: attemptedState.criticality,
			server: serverState.criticality,
			changed: true,
		});
	}

	if (
		attemptedState?.category &&
		serverState?.category &&
		attemptedState.category !== serverState.category
	) {
		rows.push({
			label: "Categoria",
			attempted: attemptedState.category,
			server: serverState.category,
			changed: true,
		});
	}

	return rows;
}

export function ConflictModal({
	isOpen,
	onClose,
	traceId,
	expectedVersion,
	currentVersion,
	serverState,
	attemptedState,
	onReloadLatest,
}: ConflictModalProps) {
	const [copied, setCopied] = useState(false);

	if (!isOpen) return null;

	const diffRows = buildConflictDiffRows(
		expectedVersion,
		currentVersion,
		serverState,
		attemptedState,
	);

	const handleCopyNotes = async () => {
		if (attemptedState?.notes) {
			try {
				await navigator.clipboard.writeText(attemptedState.notes);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch {}
		}
	};

	const handleReload = () => {
		onReloadLatest?.();
		onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
			<button
				type="button"
				tabIndex={-1}
				aria-hidden="true"
				onClick={onClose}
				className="fixed inset-0 bg-black/75 backdrop-blur-xs cursor-default"
			/>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="conflict-modal-title"
				className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121215] border border-amber-300 dark:border-amber-900/60 rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in transition-colors"
			>
				<header className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-amber-200 dark:border-[#27272a] bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
					<div className="flex items-center gap-2.5">
						<span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
						<div>
							<h2
								id="conflict-modal-title"
								className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide"
							>
								Conflito de Concorrência Detectado (OCC)
							</h2>
							{traceId && (
								<p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
									X-Request-ID: {traceId}
								</p>
							)}
						</div>
					</div>

					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar modal de conflito"
						className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors"
					>
						✕
					</button>
				</header>

				<div className="p-4 sm:p-5 space-y-4">
					<div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
						Outro operador atualizou este incidente enquanto você realizava
						alterações. Para evitar a perda silenciosa de dados (
						<em>Lost Update</em>), o servidor recusou a gravação com HTTP 409
						Conflict.
					</div>

					<div className="border border-zinc-200 dark:border-[#27272a] rounded-lg overflow-hidden">
						<div className="bg-zinc-50 dark:bg-[#18181b] px-3 py-2 border-b border-zinc-200 dark:border-[#27272a] text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
							Comparativo de Dados (Diff)
						</div>
						<div className="divide-y divide-zinc-200 dark:divide-[#27272a] text-xs">
							<div className="grid grid-cols-3 px-3 py-1.5 font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-[#151518]">
								<span>Campo</span>
								<span>Sua Tentativa</span>
								<span>No Servidor Agora</span>
							</div>
							{diffRows.map((row) => (
								<div
									key={row.label}
									className={`grid grid-cols-3 px-3 py-2 items-center ${
										row.changed
											? "bg-amber-50/40 dark:bg-amber-950/20 font-medium"
											: ""
									}`}
								>
									<span className="text-zinc-700 dark:text-zinc-300">
										{row.label}
									</span>
									<span
										className={
											row.changed
												? "text-rose-600 dark:text-rose-400 line-through decoration-rose-400"
												: "text-zinc-500 dark:text-zinc-400"
										}
									>
										{row.attempted}
									</span>
									<span
										className={
											row.changed
												? "text-emerald-700 dark:text-emerald-400 font-semibold"
												: "text-zinc-700 dark:text-zinc-300"
										}
									>
										{row.server}
									</span>
								</div>
							))}
						</div>
					</div>

					{attemptedState?.notes && (
						<div className="border border-zinc-200 dark:border-[#27272a] rounded-lg p-3 bg-zinc-50/60 dark:bg-[#18181b]">
							<div className="flex items-center justify-between mb-1.5">
								<span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
									Suas Anotações Digitadas
								</span>
								<button
									type="button"
									onClick={handleCopyNotes}
									className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-[#202024] border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
								>
									{copied ? "✓ Copiado!" : "Copiar Anotações"}
								</button>
							</div>
							<p className="text-xs text-zinc-800 dark:text-zinc-200 bg-white dark:bg-[#121215] p-2 rounded border border-zinc-200 dark:border-[#27272a] whitespace-pre-wrap">
								{attemptedState.notes}
							</p>
						</div>
					)}
				</div>

				<footer className="px-4 py-3 sm:px-5 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#18181b] flex items-center justify-end gap-2.5">
					<button
						type="button"
						onClick={onClose}
						className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#202024] transition-colors"
					>
						Fechar
					</button>
					<button
						type="button"
						onClick={handleReload}
						className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
					>
						Recarregar dados mais recentes
					</button>
				</footer>
			</div>
		</div>
	);
}
