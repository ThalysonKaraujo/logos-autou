import type { ErrorResponse } from "@/entities/incident/model/types";

export interface RequestOptions extends RequestInit {
	requestId?: string;
}

export interface ApiResponse<T> {
	data: T;
	requestId: string | null;
	processTime: string | null;
}

export class ApiError extends Error {
	public readonly status: number;
	public readonly data: ErrorResponse | null;
	public readonly requestId: string | null;

	constructor(
		status: number,
		data: ErrorResponse | null,
		requestId: string | null,
	) {
		super(data?.message || `Request failed with status ${status}`);
		this.name = "ApiError";
		this.status = status;
		this.data = data;
		this.requestId = requestId;
	}

	get isConflict(): boolean {
		return this.status === 409;
	}

	get isNotFound(): boolean {
		return this.status === 404;
	}

	get isBadRequest(): boolean {
		return this.status === 400;
	}
}

const getBaseUrl = (): string => {
	const envUrl = import.meta.env?.VITE_API_BASE_URL;
	if (envUrl) {
		return envUrl.replace(/\/+$/, "");
	}
	return "http://localhost:8000/api/v1";
};

const executeRequest = async <T>(
	endpoint: string,
	options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
	const baseUrl = getBaseUrl();
	const sanitizedEndpoint = endpoint.startsWith("/")
		? endpoint
		: `/${endpoint}`;
	const url = `${baseUrl}${sanitizedEndpoint}`;

	const headers = new Headers(options.headers || {});
	if (
		!headers.has("Content-Type") &&
		options.body &&
		typeof options.body === "string"
	) {
		headers.set("Content-Type", "application/json");
	}

	const traceId = options.requestId || crypto.randomUUID();
	if (!headers.has("X-Request-ID")) {
		headers.set("X-Request-ID", traceId);
	}

	const response = await fetch(url, {
		...options,
		headers,
	});

	const responseRequestId =
		response.headers.get("x-request-id") || headers.get("X-Request-ID");
	const responseProcessTime = response.headers.get("x-process-time");

	if (!response.ok) {
		let errorPayload: ErrorResponse | null = null;
		try {
			errorPayload = (await response.json()) as ErrorResponse;
		} catch {
			errorPayload = null;
		}
		throw new ApiError(response.status, errorPayload, responseRequestId);
	}

	const data = (await response.json()) as T;
	return {
		data,
		requestId: responseRequestId,
		processTime: responseProcessTime,
	};
};

export const apiClient = {
	get: <T>(
		endpoint: string,
		options?: RequestOptions,
	): Promise<ApiResponse<T>> =>
		executeRequest<T>(endpoint, { ...options, method: "GET" }),

	post: <T>(
		endpoint: string,
		body?: unknown,
		options?: RequestOptions,
	): Promise<ApiResponse<T>> =>
		executeRequest<T>(endpoint, {
			...options,
			method: "POST",
			body: body ? JSON.stringify(body) : undefined,
		}),

	patch: <T>(
		endpoint: string,
		body?: unknown,
		options?: RequestOptions,
	): Promise<ApiResponse<T>> =>
		executeRequest<T>(endpoint, {
			...options,
			method: "PATCH",
			body: body ? JSON.stringify(body) : undefined,
		}),
};
