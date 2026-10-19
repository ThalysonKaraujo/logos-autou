import type { IncidentDetail } from "@/entities/incident/model/types";
import { CATEGORIES, CRITICALITIES } from "../model/constants";
import { useEditIncidentForm } from "../model/useEditIncidentForm";

export interface EditIncidentModalProps {
	incident: IncidentDetail | null;
	isOpen: boolean;
	onClose: () => void;
	onConflictDetected?: (requestId: string | null) => void;
}

export function EditIncidentModal(props: EditIncidentModalProps) {
	const { incident, isOpen, onClose } = props;
	const form = useEditIncidentForm(props);

	if (!isOpen || !incident) return null;

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
				aria-labelledby="edit-modal-title"
				className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in transition-colors"
			>
				<header className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between">
					<div>
						<div className="flex items-center gap-2">
							<h2
								id="edit-modal-title"
								className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide"
							>
								Editar Ocorrência Operacional
							</h2>
							<span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
								v{incident.version}
							</span>
						</div>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
							Auditoria e controle de concorrência ativos • Operador:{" "}
							<span className="font-mono text-zinc-700 dark:text-zinc-300">
								{form.operator}
							</span>
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar modal de edição"
						className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors"
					>
						✕
					</button>
				</header>

				<form
					onSubmit={form.handleSubmit}
					className="p-4 sm:p-5 flex flex-col gap-3.5"
				>
					{form.submitError && (
						<div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
							{form.submitError}
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-incident-title"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Título da Ocorrência
						</label>
						<input
							id="edit-incident-title"
							type="text"
							required
							minLength={3}
							maxLength={150}
							value={form.title}
							onChange={(e) => form.setTitle(e.target.value)}
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-colors"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="edit-incident-plate"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Placa do Caminhão
							</label>
							<input
								id="edit-incident-plate"
								type="text"
								required
								value={form.truckPlate}
								onChange={(e) => form.handlePlateChange(e.target.value)}
								onBlur={form.handlePlateBlur}
								maxLength={8}
								className={`bg-zinc-50 dark:bg-[#18181b] border ${
									form.plateError
										? "border-rose-500"
										: "border-zinc-200 dark:border-[#27272a]"
								} focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono outline-none uppercase transition-colors`}
							/>
							{form.plateError && (
								<span className="text-[11px] text-rose-600 dark:text-rose-400">
									{form.plateError}
								</span>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="edit-incident-driver"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Nome do Motorista
							</label>
							<input
								id="edit-incident-driver"
								type="text"
								value={form.driverName}
								onChange={(e) => form.setDriverName(e.target.value)}
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-colors"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="edit-incident-category"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Categoria
							</label>
							<select
								id="edit-incident-category"
								value={form.category}
								onChange={(e) => form.handleCategoryChange(e.target.value)}
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-2.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer transition-colors"
							>
								{CATEGORIES.map((cat) => (
									<option
										key={cat}
										value={cat}
										className="bg-white dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200"
									>
										{cat}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="edit-incident-criticality"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Criticidade
							</label>
							<select
								id="edit-incident-criticality"
								value={form.criticality}
								onChange={(e) => form.handleCriticalityChange(e.target.value)}
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-2.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer transition-colors"
							>
								{CRITICALITIES.map((crit) => (
									<option
										key={crit}
										value={crit}
										className="bg-white dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200"
									>
										{crit}
									</option>
								))}
							</select>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-incident-location"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Localização na Rodovia
						</label>
						<input
							id="edit-incident-location"
							type="text"
							required
							minLength={3}
							maxLength={120}
							value={form.location}
							onChange={(e) => form.setLocation(e.target.value)}
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-colors"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-incident-description"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Descrição da Ocorrência
						</label>
						<textarea
							id="edit-incident-description"
							required
							minLength={5}
							rows={3}
							value={form.description}
							onChange={(e) => form.setDescription(e.target.value)}
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none resize-none transition-colors"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="edit-incident-notes"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Justificativa / Nota de Auditoria (opcional)
						</label>
						<input
							id="edit-incident-notes"
							type="text"
							maxLength={300}
							value={form.notes}
							onChange={(e) => form.setNotes(e.target.value)}
							placeholder="Ex: Reclassificado após confirmação da PRF..."
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-colors"
						/>
					</div>

					<footer className="pt-2 border-t border-zinc-200 dark:border-[#27272a] flex items-center justify-end gap-2">
						<button
							type="button"
							onClick={onClose}
							className="px-3 py-1.5 rounded text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors"
						>
							Cancelar
						</button>

						<button
							type="submit"
							disabled={form.isSubmitting}
							className="px-4 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-50 transition-colors"
						>
							{form.isSubmitting ? "Salvando..." : "Salvar Alterações"}
						</button>
					</footer>
				</form>
			</div>
		</div>
	);
}
