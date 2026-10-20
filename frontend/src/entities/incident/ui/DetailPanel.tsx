import {
	ArrowLeft,
	CheckCircle2,
	HelpCircle,
	Loader2,
	Pencil,
	RotateCcw,
	UserCheck,
} from "lucide-react";
import { useState } from "react";
import {
	useIncidentDetail,
	useUpdateIncidentStatus,
} from "@/entities/incident/api";
import type {
	IncidentDetail,
	IncidentStatus,
} from "@/entities/incident/model/types";
import { useOperator } from "@/features/operator-session";
import { formatShortDate } from "@/shared/lib";
import { CriticalityDot, IncidentSkeleton, PlateBadge } from "@/shared/ui";

export interface DetailPanelProps {
	incidentId: string | null;
	onBackToList?: () => void;
	onConflictDetected?: (
		requestId: string | null,
		conflictData?: {
			expected_version?: number;
			current_version?: number;
			server_state?: IncidentDetail | null;
		} | null,
		attempted?: {
			status?: string;
			notes?: string | null;
		} | null,
	) => void;
	onEditIncident?: (incident: IncidentDetail) => void;
}

export function DetailPanel({
	incidentId,
	onBackToList,
	onConflictDetected,
	onEditIncident,
}: DetailPanelProps) {
	const { operator } = useOperator();
	const { data: incident, isLoading, isError } = useIncidentDetail(incidentId);
	const updateStatusMutation = useUpdateIncidentStatus();
	const [notes, setNotes] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);
	const [pendingStatus, setPendingStatus] = useState<IncidentStatus | null>(
		null,
	);

	if (!incidentId) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg shadow-xs transition-colors">
				<p className="text-xs font-medium text-zinc-700 dark:text-zinc-400">
					Nenhum chamado selecionado
				</p>
				<p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
					Selecione uma ocorrência na fila de triagem para visualizar os
					detalhes e a trilha de auditoria.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="w-full p-4 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg h-full shadow-xs transition-colors">
				<IncidentSkeleton count={3} />
			</div>
		);
	}

	if (isError || !incident) {
		return (
			<div className="w-full p-6 bg-white dark:bg-[#121215] border border-red-200 dark:border-red-900/40 rounded-lg text-center space-y-2 shadow-xs transition-colors">
				<p className="text-xs text-red-600 dark:text-red-400">
					Erro ao carregar os detalhes do chamado.
				</p>
				{onBackToList && (
					<button
						type="button"
						onClick={onBackToList}
						className="px-3 py-1 rounded text-xs bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
					>
						Voltar para a fila
					</button>
				)}
			</div>
		);
	}

	const handleStatusChange = async (newStatus: IncidentStatus) => {
		if (incident.status === newStatus) return;
		setActionError(null);
		setPendingStatus(newStatus);

		try {
			await updateStatusMutation.mutateAsync({
				incidentId: incident.id,
				payload: {
					status: newStatus,
					expected_version: incident.version,
					version: incident.version,
					analyst_name: operator,
					notes: notes.trim() || null,
				},
			});
			setNotes("");
		} catch (error: unknown) {
			const err = error as {
				status?: number;
				requestId?: string | null;
				message?: string;
				data?: {
					details?: {
						expected_version?: number;
						current_version?: number;
						server_state?: IncidentDetail | null;
					};
				};
			};
			if (err?.status === 409) {
				onConflictDetected?.(err.requestId || null, err.data?.details || null, {
					status: newStatus,
					notes: notes.trim() || null,
				});
			} else {
				setActionError(err?.message || "Erro ao atualizar status do chamado.");
			}
		} finally {
			setPendingStatus(null);
		}
	};

	return (
		<div className="w-full flex-1 bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-lg flex flex-col h-full overflow-hidden shadow-xs transition-colors">
			<div className="px-3 py-2.5 sm:px-4 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between gap-2 flex-wrap">
				<div className="flex items-center gap-2">
					{onBackToList && (
						<button
							type="button"
							onClick={onBackToList}
							aria-label="Voltar para a fila de triagem"
							className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-[#18181b] hover:bg-zinc-200 dark:hover:bg-[#27272a] border border-zinc-200 dark:border-[#27272a] transition-colors shrink-0 shadow-2xs active:scale-95 touch-manipulation mr-1"
						>
							<ArrowLeft className="w-3.5 h-3.5 shrink-0" />
							<span>Voltar à Fila</span>
						</button>
					)}
					<PlateBadge plate={incident.truck_plate} />
					<div className="flex items-center gap-1.5">
						<CriticalityDot criticality={incident.criticality} />
						<span
							className={`text-xs font-medium ${
								incident.criticality === "Alta"
									? "text-rose-600 dark:text-rose-400"
									: incident.criticality === "Média"
										? "text-amber-600 dark:text-amber-400"
										: "text-emerald-600 dark:text-emerald-400"
							}`}
						>
							{incident.criticality.toUpperCase()}
						</span>
					</div>
					<span className="text-zinc-300 dark:text-zinc-700">•</span>
					<span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
						{incident.status}
					</span>
					<span className="text-zinc-300 dark:text-zinc-700">•</span>
					<span className="text-xs font-mono text-zinc-500">
						v{incident.version}
					</span>
				</div>

				<div className="flex items-center gap-3">
					<div className="text-xs text-zinc-500">
						Atribuído:{" "}
						<span className="text-zinc-800 dark:text-zinc-300 font-medium">
							{incident.assigned_to || "Não atribuído"}
						</span>
					</div>
					{onEditIncident && (
						<button
							type="button"
							onClick={() => onEditIncident(incident)}
							className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-zinc-100 dark:bg-[#18181b] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-[#27272a] hover:bg-zinc-200 dark:hover:bg-[#27272a] hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
						>
							<Pencil className="w-3 h-3 shrink-0" />
							<span>Editar</span>
						</button>
					)}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
				<div>
					<h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-snug">
						{incident.title}
					</h2>
					<p className="mt-2 text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-[#18181b] p-3 rounded border border-zinc-200 dark:border-[#27272a]">
						{incident.description}
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
					<div className="p-2.5 rounded bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Categoria</span>
						<span className="text-zinc-800 dark:text-zinc-200 font-medium mt-0.5 block">
							{incident.category}
						</span>
					</div>
					<div className="p-2.5 rounded bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Motorista</span>
						<span className="text-zinc-800 dark:text-zinc-200 font-medium mt-0.5 block">
							{incident.driver_name}
						</span>
					</div>
					<div className="p-2.5 rounded bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
						<span className="text-zinc-500 block text-xs">
							Data da Ocorrência
						</span>
						<span className="font-mono text-zinc-700 dark:text-zinc-300 mt-0.5 block truncate">
							{formatShortDate(incident.created_at)}
						</span>
					</div>
					<div className="p-2.5 rounded bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Atualizado em</span>
						<span className="font-mono text-zinc-700 dark:text-zinc-300 mt-0.5 block truncate">
							{new Date(incident.updated_at).toLocaleTimeString("pt-BR")}
						</span>
					</div>
					<div className="col-span-1 sm:col-span-4 p-2.5 rounded bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Localização</span>
						<span className="text-zinc-800 dark:text-zinc-200 font-medium mt-0.5 block">
							{incident.location}
						</span>
					</div>
				</div>

				<div className="border border-zinc-200 dark:border-[#27272a] bg-zinc-50/60 dark:bg-[#141418] rounded-lg p-3 space-y-2.5">
					<div className="flex items-center justify-between">
						<span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
							Despacho Operacional
						</span>
						<span className="text-xs font-mono text-zinc-500">
							Operador:{" "}
							<span className="text-zinc-800 dark:text-zinc-300 font-medium">
								{operator}
							</span>
						</span>
					</div>

					<input
						type="text"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Nota operacional de despacho (opcional)..."
						className="w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
					/>

					{actionError && (
						<div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-300">
							{actionError}
						</div>
					)}

					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
						<button
							type="button"
							disabled={
								incident.status === "Aberto" || updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Aberto")}
							className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded text-xs font-medium border transition-colors bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60 dark:hover:bg-amber-900/50 dark:hover:border-amber-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
						>
							{updateStatusMutation.isPending && pendingStatus === "Aberto" ? (
								<>
									<Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
									<span>Reabrindo...</span>
								</>
							) : (
								<>
									<RotateCcw className="w-3.5 h-3.5 shrink-0" />
									<span>Reabrir Chamado</span>
								</>
							)}
						</button>
						<button
							type="button"
							disabled={
								incident.status === "Em Investigação" ||
								updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Em Investigação")}
							className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded text-xs font-medium border transition-colors bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60 dark:hover:bg-blue-900/50 dark:hover:border-blue-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
						>
							{updateStatusMutation.isPending &&
							pendingStatus === "Em Investigação" ? (
								<>
									<Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
									<span>Assumindo...</span>
								</>
							) : (
								<>
									<UserCheck className="w-3.5 h-3.5 shrink-0" />
									<span>Assumir Investigação</span>
								</>
							)}
						</button>
						<button
							type="button"
							disabled={
								incident.status === "Fechado" || updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Fechado")}
							className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded text-xs font-medium border transition-colors bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 dark:hover:bg-emerald-900/50 dark:hover:border-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
						>
							{updateStatusMutation.isPending && pendingStatus === "Fechado" ? (
								<>
									<Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
									<span>Fechando...</span>
								</>
							) : (
								<>
									<CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
									<span>Fechar Chamado</span>
								</>
							)}
						</button>
						<button
							type="button"
							disabled={
								incident.status === "Inconclusivo" ||
								updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Inconclusivo")}
							className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded text-xs font-medium border transition-colors bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200 hover:border-zinc-300 dark:bg-[#18181b] dark:text-zinc-300 dark:border-[#27272a] dark:hover:bg-[#27272a] dark:hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
						>
							{updateStatusMutation.isPending &&
							pendingStatus === "Inconclusivo" ? (
								<>
									<Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
									<span>Registrando...</span>
								</>
							) : (
								<>
									<HelpCircle className="w-3.5 h-3.5 shrink-0" />
									<span>Inconclusivo</span>
								</>
							)}
						</button>
					</div>
				</div>

				<div className="border-t border-zinc-200 dark:border-[#27272a] pt-3">
					<span className="text-xs font-medium text-zinc-700 dark:text-zinc-400 block mb-3">
						Trilha de Auditoria
					</span>
					<div className="space-y-3 relative before:absolute before:inset-0 before:left-1 before:w-[1px] before:bg-zinc-200 dark:before:bg-[#27272a]">
						{incident.history?.map((h) => (
							<div key={h.id} className="relative pl-5">
								<span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-zinc-400 ring-2 ring-white dark:ring-[#121215]" />
								<div className="flex items-center justify-between text-xs">
									<span className="text-zinc-800 dark:text-zinc-300 font-medium">
										{h.analyst_name}
									</span>
									<span className="font-mono text-zinc-500">
										{new Date(h.created_at).toLocaleTimeString("pt-BR", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
								<p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
									{h.action === "UPDATED" ? (
										<span>
											Edição operacional:{" "}
											<span className="text-zinc-900 dark:text-zinc-200 font-medium">
												{h.to_status}
											</span>
										</span>
									) : h.from_status ? (
										<span>
											{h.from_status} →{" "}
											<span className="text-zinc-900 dark:text-zinc-200 font-medium">
												{h.to_status}
											</span>
										</span>
									) : (
										<span>
											Abertura:{" "}
											<span className="text-zinc-900 dark:text-zinc-200 font-medium">
												{h.to_status}
											</span>
										</span>
									)}
								</p>
								{h.notes && (
									<p className="text-xs text-zinc-500 mt-0.5 italic">
										"{h.notes}"
									</p>
								)}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
