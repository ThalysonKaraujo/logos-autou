import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export interface NotificationToastProps {
	type: "success" | "error" | "info";
	title: string;
	message?: string;
	duration?: number;
	onClose: () => void;
}

export function NotificationToast({
	type,
	title,
	message,
	duration = 4500,
	onClose,
}: NotificationToastProps) {
	useEffect(() => {
		if (duration <= 0) return;
		const timer = setTimeout(() => {
			onClose();
		}, duration);
		return () => clearTimeout(timer);
	}, [duration, onClose]);

	const isError = type === "error";

	return (
		<aside
			role={isError ? "alert" : "status"}
			aria-live="polite"
			className="fixed top-4 right-4 z-50 flex items-start gap-3 p-3.5 max-w-sm w-full bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] rounded-xl shadow-xl animate-fade-in transition-all text-xs"
		>
			<div
				className={`p-1 rounded-full shrink-0 mt-0.5 ${
					isError
						? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
						: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
				}`}
			>
				{isError ? (
					<AlertCircle className="w-4 h-4" />
				) : (
					<CheckCircle2 className="w-4 h-4" />
				)}
			</div>

			<div className="flex-1 min-w-0 pr-1">
				<p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
					{title}
				</p>
				{message && (
					<p className="text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed break-words">
						{message}
					</p>
				)}
			</div>

			<button
				type="button"
				onClick={onClose}
				aria-label="Fechar notificação"
				className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 rounded transition-colors shrink-0"
			>
				<X className="w-4 h-4" />
			</button>
		</aside>
	);
}
