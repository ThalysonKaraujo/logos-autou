import { describe, expect, it } from "vitest";
import { formatPlate, isValidPlate } from "./validation";

describe("Plate Validation", () => {
	it("accepts valid Mercosul plates", () => {
		expect(isValidPlate("BRA2E19")).toBe(true);
		expect(isValidPlate("LOG0A10")).toBe(true);
		expect(isValidPlate("xyz9k88")).toBe(true);
	});

	it("accepts valid legacy Brazilian plates", () => {
		expect(isValidPlate("ABC1234")).toBe(true);
		expect(isValidPlate("abc-1234")).toBe(true);
	});

	it("rejects invalid plates", () => {
		expect(isValidPlate("")).toBe(false);
		expect(isValidPlate("1234567")).toBe(false);
		expect(isValidPlate("ABCD123")).toBe(false);
		expect(isValidPlate("AB12345")).toBe(false);
		expect(isValidPlate("ABCDE")).toBe(false);
		expect(isValidPlate("ABC1D2")).toBe(false);
		expect(isValidPlate("ABC12345")).toBe(false);
	});

	it("formats and normalizes plates correctly", () => {
		expect(formatPlate("abc-1234")).toBe("ABC1234");
		expect(formatPlate("bra-2e19")).toBe("BRA2E19");
		expect(formatPlate(" log 0a 10 ")).toBe("LOG0A10");
	});
});
