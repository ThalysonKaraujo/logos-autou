export function formatPlate(input: string): string {
	return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function isValidPlate(input: string): boolean {
	const clean = formatPlate(input);
	if (clean.length !== 7) return false;
	const mercosulPattern = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
	const legacyPattern = /^[A-Z]{3}[0-9]{4}$/;
	return mercosulPattern.test(clean) || legacyPattern.test(clean);
}
