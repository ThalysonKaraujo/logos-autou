export const formatShortDate = (isoString: string): string => {
	const datePart = isoString.slice(0, 10);
	if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
		const [year, month, day] = datePart.split("-");
		return `${day}/${month}/${year}`;
	}

	const parsed = new Date(isoString);
	if (Number.isNaN(parsed.getTime())) {
		return "--/--/----";
	}

	const day = String(parsed.getUTCDate()).padStart(2, "0");
	const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
	const year = parsed.getUTCFullYear();
	return `${day}/${month}/${year}`;
};

export const formatRelativeTime = (
	isoString: string,
	nowMs: number = Date.now(),
): string => {
	const parsed = new Date(isoString);
	if (Number.isNaN(parsed.getTime())) {
		return "Recente";
	}

	const diff = nowMs - parsed.getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "Agora";
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	return `${days}d`;
};

export const getTodayIsoDate = (referenceDate: Date = new Date()): string => {
	return referenceDate.toISOString().slice(0, 10);
};
