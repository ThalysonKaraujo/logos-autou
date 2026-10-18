import { useState } from "react";
import {
	useIncidentDetail,
	useUpdateIncidentStatus,
} from "@/entities/incident/api";
import type { IncidentStatus } from "@/entities/incident/model/types";
import { useOperator } from "@/features/operator-session";
import { CriticalityDot, IncidentSkeleton, PlateBadge } from "@/shared/ui";

export interface DetailPanelProps {
	incidentId: string | null;
	onBackToList?: () => void;
	onConflictDetected?: (requestId: string | null) => void;
}

export function DetailPanel({
	incidentId,
	onBackToList,
	onConflictDetected,
}: DetailPanelProps) {
	const { operator } = useOperator();
	const { data: incident, isLoading, isError } = useIncidentDetail(incidentId);
	const updateStatusMutation = useUpdateIncidentStatus();
	const [notes, setNotes] = useState("");
	const [actionError, setActionError] = useState<string | null>(null);

	if (!incidentId) {
		return (
			<div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-500 bg-[#121215] border border-[#27272a] rounded-lg">
				<p className="text-xs font-medium text-zinc-400">
					Nenhum chamado selecionado
				</p>
				<p className="text-xs text-zinc-600 mt-1">
					Selecione uma ocorrência na fila de triagem para visualizar os
					detalhes e a trilha de auditoria.
				</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="p-4 bg-[#121215] border border-[#27272a] rounded-lg h-full">
				<IncidentSkeleton count={3} />
			</div>
		);
	}

	if (isError || !incident) {
		return (
			<div className="p-6 bg-[#121215] border border-red-900/40 rounded-lg text-center space-y-2">
				<p className="text-xs text-red-400">
					Erro ao carregar os detalhes do chamado.
				</p>
				{onBackToList && (
					<button
						type="button"
						onClick={onBackToList}
						className="px-3 py-1 rounded text-xs bg-[#18181b] border border-[#27272a] text-zinc-300"
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
			};
			if (err?.status === 409) {
				onConflictDetected?.(err.requestId || null);
			} else {
				setActionError(err?.message || "Erro ao atualizar status do chamado.");
			}
		}
	};

	return (
		<div className="bg-[#121215] border border-[#27272a] rounded-lg flex flex-col h-full overflow-hidden shadow-xs">
			<div className="px-3 py-2.5 sm:px-4 border-b border-[#27272a] flex items-center justify-between gap-2 flex-wrap">
				<div className="flex items-center gap-2">
					{onBackToList && (
						<button
							type="button"
							onClick={onBackToList}
							className="lg:hidden px-2 py-0.5 rounded text-xs text-zinc-400 hover:text-zinc-100 bg-[#18181b] border border-[#27272a] mr-1"
						>
							← Fila
						</button>
					)}
					<PlateBadge plate={incident.truck_plate} />
					<div className="flex items-center gap-1.5">
						<CriticalityDot criticality={incident.criticality} />
						<span className="text-xs text-zinc-400 font-medium">
							{incident.criticality.toUpperCase()}
						</span>
					</div>
					<span className="text-zinc-700">•</span>
					<span className="text-xs text-zinc-300 font-medium">
						{incident.status}
					</span>
					<span className="text-zinc-700">•</span>
					<span className="text-xs font-mono text-zinc-500">
						v{incident.version}
					</span>
				</div>

				<div className="text-xs text-zinc-500">
					Atribuído:{" "}
					<span className="text-zinc-300 font-medium">
						{incident.assigned_to || "Não atribuído"}
					</span>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4">
				<div>
					<h2 className="font-semibold text-sm text-zinc-100 leading-snug">
						{incident.title}
					</h2>
					<p className="mt-2 text-xs text-zinc-400 leading-relaxed bg-[#18181b] p-3 rounded border border-[#27272a]">
						{incident.description}
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
					<div className="p-2.5 rounded bg-[#18181b] border border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Categoria</span>
						<span className="text-zinc-200 font-medium mt-0.5 block">
							{incident.category}
						</span>
					</div>
					<div className="p-2.5 rounded bg-[#18181b] border border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Motorista</span>
						<span className="text-zinc-200 font-medium mt-0.5 block">
							{incident.driver_name}
						</span>
					</div>
					<div className="p-2.5 rounded bg-[#18181b] border border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Atualizado em</span>
						<span className="font-mono text-zinc-300 mt-0.5 block truncate">
							{new Date(incident.updated_at).toLocaleTimeString("pt-BR")}
						</span>
					</div>
					<div className="col-span-1 sm:col-span-3 p-2.5 rounded bg-[#18181b] border border-[#27272a]">
						<span className="text-zinc-500 block text-xs">Localização</span>
						<span className="text-zinc-200 font-medium mt-0.5 block">
							{incident.location}
						</span>
					</div>
				</div>

				<div className="border-t border-[#27272a] pt-3 space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-zinc-400">
							Despacho Operacional
						</span>
						<span className="text-xs font-mono text-zinc-500">
							Operador: <span className="text-zinc-300">{operator}</span>
						</span>
					</div>

					<input
						type="text"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Nota operacional de despacho (opcional)..."
						className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-zinc-500"
					/>

					{actionError && (
						<div className="bg-rose-950/40 border border-rose-800/60 rounded px-2.5 py-1.5 text-xs text-rose-300">
							{actionError}
						</div>
					)}

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<button
							type="button"
							disabled={
								incident.status === "Em Investigação" ||
								updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Em Investigação")}
							className="py-1.5 px-3 rounded text-xs font-medium bg-[#18181b] text-zinc-200 border border-[#27272a] hover:bg-[#27272a] hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
						>
							Assumir Investigação
						</button>
						<button
							type="button"
							disabled={
								incident.status === "Fechado" || updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Fechado")}
							className="py-1.5 px-3 rounded text-xs font-medium bg-[#18181b] text-zinc-200 border border-[#27272a] hover:bg-[#27272a] hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
						>
							Fechar Chamado
						</button>
						<button
							type="button"
							disabled={
								incident.status === "Inconclusivo" ||
								updateStatusMutation.isPending
							}
							onClick={() => handleStatusChange("Inconclusivo")}
							className="py-1.5 px-3 rounded text-xs font-medium bg-[#18181b] text-zinc-400 border border-[#27272a] hover:bg-[#27272a] hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
						>
							Inconclusivo
						</button>
					</div>
				</div>

				<div className="border-t border-[#27272a] pt-3">
					<span className="text-xs font-medium text-zinc-400 block mb-3">
						Trilha de Auditoria
					</span>
					<div className="space-y-3 relative before:absolute before:inset-0 before:left-1 before:w-[1px] before:bg-[#27272a]">
						{incident.history?.map((h) => (
							<div key={h.id} className="relative pl-5">
								<span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-zinc-400 ring-2 ring-[#121215]" />
								<div className="flex items-center justify-between text-xs">
									<span className="text-zinc-300 font-medium">
										{h.analyst_name}
									</span>
									<span className="font-mono text-zinc-500">
										{new Date(h.created_at).toLocaleTimeString("pt-BR", {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</span>
								</div>
								<p className="text-xs text-zinc-400 mt-0.5">
									{h.from_status ? (
										<span>
											{h.from_status} →{" "}
											<span className="text-zinc-200 font-medium">
												{h.to_status}
											</span>
										</span>
									) : (
										<span>
											Abertura:{" "}
											<span className="text-zinc-200 font-medium">
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
