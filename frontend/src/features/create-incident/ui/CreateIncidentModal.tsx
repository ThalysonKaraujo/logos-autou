import {
	CREATE_CATEGORIES,
	CREATE_CRITICALITIES,
	type CreateIncidentModalProps,
	useCreateIncidentForm,
} from "../model/useCreateIncidentForm";

export type { CreateIncidentModalProps };

export function CreateIncidentModal(props: CreateIncidentModalProps) {
	const { isOpen, onClose } = props;
	const {
		title,
		setTitle,
		truckPlate,
		handlePlateChange,
		handlePlateBlur,
		driverName,
		setDriverName,
		category,
		handleCategoryChange,
		criticality,
		handleCriticalityChange,
		incidentDate,
		setIncidentDate,
		location,
		setLocation,
		description,
		setDescription,
		plateError,
		submitError,
		handleSubmit,
		isPending,
	} = useCreateIncidentForm(props);

	if (!isOpen) return null;

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
				aria-labelledby="modal-title"
				className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-xl shadow-2xl overflow-hidden my-auto animate-fade-in transition-colors"
			>
				<header className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-zinc-200 dark:border-[#27272a] flex items-center justify-between">
					<div>
						<h2
							id="modal-title"
							className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-wide"
						>
							Novo Chamado de Incidente
						</h2>
						<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
							Registro operacional de ocorrência na frota
						</p>
					</div>

					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar modal"
						className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-[#18181b] transition-colors"
					>
						✕
					</button>
				</header>

				<form
					onSubmit={handleSubmit}
					className="p-4 sm:p-5 flex flex-col gap-3.5"
				>
					{submitError && (
						<div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
							{submitError}
						</div>
					)}

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="incident-title"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Título da Ocorrência
						</label>
						<input
							id="incident-title"
							type="text"
							required
							minLength={3}
							maxLength={150}
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Ex: Rompimento de mangueira pneumática"
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-colors"
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="incident-plate"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Placa do Caminhão
							</label>
							<input
								id="incident-plate"
								type="text"
								required
								value={truckPlate}
								onChange={(e) => handlePlateChange(e.target.value)}
								onBlur={handlePlateBlur}
								placeholder="Ex: LOG0A10"
								maxLength={8}
								className={`bg-zinc-50 dark:bg-[#18181b] border ${
									plateError
										? "border-rose-500"
										: "border-zinc-200 dark:border-[#27272a]"
								} focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none uppercase transition-colors`}
							/>
							{plateError && (
								<span className="text-[11px] text-rose-600 dark:text-rose-400">
									{plateError}
								</span>
							)}
						</div>

						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="incident-driver"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Nome do Motorista
							</label>
							<input
								id="incident-driver"
								type="text"
								value={driverName}
								onChange={(e) => setDriverName(e.target.value)}
								placeholder="Ex: Carlos Silva"
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-colors"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="incident-category"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Categoria
							</label>
							<select
								id="incident-category"
								value={category}
								onChange={(e) => handleCategoryChange(e.target.value)}
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-2.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer transition-colors"
							>
								{CREATE_CATEGORIES.map((cat) => (
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
								htmlFor="incident-criticality"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Criticidade
							</label>
							<select
								id="incident-criticality"
								value={criticality}
								onChange={(e) => handleCriticalityChange(e.target.value)}
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-2.5 py-2 text-xs text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer transition-colors"
							>
								{CREATE_CRITICALITIES.map((crit) => (
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

						<div className="flex flex-col gap-1.5">
							<label
								htmlFor="incident-date"
								className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
							>
								Data da Ocorrência
							</label>
							<input
								id="incident-date"
								type="date"
								required
								value={incidentDate}
								onChange={(e) => setIncidentDate(e.target.value)}
								className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-colors"
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="incident-location"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Localização na Rodovia
						</label>
						<input
							id="incident-location"
							type="text"
							required
							minLength={3}
							maxLength={120}
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="Ex: BR-116, Km 340 - Registro/SP"
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-colors"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="incident-description"
							className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
						>
							Descrição da Ocorrência
						</label>
						<textarea
							id="incident-description"
							required
							minLength={5}
							rows={3}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Descreva a situação, anomalias e providências iniciais tomadas..."
							className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] focus:border-zinc-400 dark:focus:border-zinc-500 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none resize-none transition-colors"
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
							disabled={isPending}
							className="px-4 py-1.5 rounded text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white disabled:opacity-50 transition-colors"
						>
							{isPending ? "Criando..." : "Criar Chamado"}
						</button>
					</footer>
				</form>
			</div>
		</div>
	);
}
