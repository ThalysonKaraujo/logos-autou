import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient } from "./client";

describe("apiClient", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("executes get request and captures x-request-id and x-process-time headers", async () => {
		const mockPayload = { status: "healthy" };
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
				"x-request-id": "req-test-uuid-123",
				"x-process-time": "4.20ms",
			}),
			json: async () => mockPayload,
		});

		const result = await apiClient.get<{ status: string }>("/health");

		expect(result.data).toEqual(mockPayload);
		expect(result.requestId).toBe("req-test-uuid-123");
		expect(result.processTime).toBe("4.20ms");

		expect(globalThis.fetch).toHaveBeenCalledWith(
			expect.stringContaining("/health"),
			expect.objectContaining({
				method: "GET",
				headers: expect.any(Headers),
			}),
		);
	});

	it("propagates custom x-request-id when provided in request options", async () => {
		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			headers: new Headers({
				"content-type": "application/json",
				"x-request-id": "custom-trace-999",
			}),
			json: async () => ({ success: true }),
		});

		await apiClient.get("/test", {
			requestId: "custom-trace-999",
		});

		const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
		const headers = fetchCall[1]?.headers as Headers;
		expect(headers.get("X-Request-ID")).toBe("custom-trace-999");
	});

	it("throws ApiError with status and response payload on 409 concurrency conflict", async () => {
		const conflictErrorPayload = {
			status_code: 409,
			status_name: "Conflict",
			message: "Este incidente foi modificado por outro operador",
			details: { current_version: 3, expected_version: 2 },
		};

		globalThis.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 409,
			headers: new Headers({
				"content-type": "application/json",
				"x-request-id": "conflict-occ-409",
			}),
			json: async () => conflictErrorPayload,
		});

		let thrownError: unknown;
		try {
			await apiClient.patch("/incidents/123/status", {
				status: "Fechado",
				version: 2,
				analyst_name: "Carlos Mendes",
			});
		} catch (error) {
			thrownError = error;
		}

		expect(thrownError).toBeInstanceOf(ApiError);
		const apiError = thrownError as ApiError;
		expect(apiError.status).toBe(409);
		expect(apiError.requestId).toBe("conflict-occ-409");
		expect(apiError.data).toEqual(conflictErrorPayload);
		expect(apiError.message).toBe(
			"Este incidente foi modificado por outro operador",
		);
	});
});
