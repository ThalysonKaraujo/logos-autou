import { useOperator } from "@/features/operator-session";

export interface TopbarProps {
	onOpenNewIncident: () => void;
	onSimulateOCC: () => void;
	latencyMs?: number;
	requestId?: string | null;
}

export function Topbar({
	onOpenNewIncident,
	onSimulateOCC,
	latencyMs = 1.4,
	requestId = "5863276b",
}: TopbarProps) {
	const { operator, availableOperators, setOperator } = useOperator();

	return (
		<header className="bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
			<div className="flex items-center justify-between md:justify-start gap-3">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-xs tracking-wider text-zinc-100">
						LOGOS
					</span>
					<span className="text-zinc-600">/</span>
					<span className="text-zinc-400 text-xs">Central de Incidentes</span>
					<span className="text-zinc-600 font-mono text-xs hidden sm:inline">
						(AutoU 5.000)
					</span>
				</div>

				<div className="flex items-center gap-2 pl-3 border-l border-[#27272a]">
					<span
						role="status"
						aria-label="Conexão com a API online"
						className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
					/>
					<span className="font-mono text-xs text-zinc-400">
						{latencyMs.toFixed(1)}ms
					</span>
					{requestId && (
						<span className="font-mono text-xs text-zinc-600 hidden lg:inline">
							req:{requestId.slice(0, 8)}
						</span>
					)}
				</div>
			</div>

			<div className="flex items-center flex-wrap gap-2">
				<div className="flex items-center gap-1.5 bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded">
					<label
						htmlFor="operator-select"
						className="text-zinc-500 text-xs shrink-0"
					>
						Operador:
					</label>
					<select
						id="operator-select"
						value={operator}
						onChange={(e) => setOperator(e.target.value)}
						className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer font-medium"
					>
						{availableOperators.map((op) => (
							<option
								key={op}
								value={op}
								className="bg-[#18181b] text-zinc-200"
							>
								{op}
							</option>
						))}
					</select>
				</div>

				<button
					type="button"
					onClick={onSimulateOCC}
					className="px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 bg-[#18181b] border border-[#27272a] hover:border-zinc-600 transition-colors"
				>
					Simular OCC (409)
				</button>

				<button
					type="button"
					onClick={onOpenNewIncident}
					className="px-3 py-1 rounded text-xs font-medium bg-zinc-100 text-zinc-950 hover:bg-white transition-colors"
				>
					+ Novo Chamado
				</button>
			</div>
		</header>
	);
}
