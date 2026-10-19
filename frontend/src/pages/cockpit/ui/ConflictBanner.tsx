interface ConflictBannerProps {
	traceId: string | null;
	onDismiss: () => void;
}

export function ConflictBanner({ traceId, onDismiss }: ConflictBannerProps) {
	if (!traceId) {
		return null;
	}

	return (
		<div className="bg-amber-50 dark:bg-[#18181b] border border-amber-300 dark:border-amber-900/60 rounded-lg p-3 flex items-start justify-between gap-3 shadow-xs animate-fade-in">
			<div className="flex items-start gap-2.5">
				<span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
				<div>
					<div className="flex items-center gap-2">
						<span className="font-semibold text-xs text-amber-900 dark:text-amber-200">
							Conflito de Concorrência Detectado (409)
						</span>
						<span className="font-mono text-xs text-amber-700/80 dark:text-zinc-500">
							X-Request-ID: {traceId}
						</span>
					</div>
					<p className="text-xs text-amber-800 dark:text-zinc-400 mt-0.5">
						Este incidente foi alterado por outro operador simultaneamente. Os
						dados foram sincronizados automaticamente com o estado mais recente.
					</p>
				</div>
			</div>
			<button
				type="button"
				onClick={onDismiss}
				className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 px-1 py-0.5 font-medium transition-colors"
			>
				Dispensar
			</button>
		</div>
	);
}
