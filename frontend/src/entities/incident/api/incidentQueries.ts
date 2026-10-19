import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { apiClient } from "@/shared/api/client";
import type {
	Incident,
	IncidentCreateInput,
	IncidentDetail,
	IncidentFilters,
	IncidentListResponse,
	IncidentStatusUpdateInput,
	IncidentUpdateInput,
} from "../model/types";

export const incidentKeys = {
	all: ["incidents"] as const,
	lists: () => [...incidentKeys.all, "list"] as const,
	list: (filters?: IncidentFilters) =>
		[...incidentKeys.lists(), filters] as const,
	details: () => [...incidentKeys.all, "detail"] as const,
	detail: (id: string) => [...incidentKeys.details(), id] as const,
};

export const buildQueryParams = (filters?: IncidentFilters): string => {
	if (!filters) return "";
	const params = new URLSearchParams();
	if (filters.status) params.set("status", filters.status);
	if (filters.category) params.set("category", filters.category);
	if (filters.criticality) params.set("criticality", filters.criticality);
	if (filters.search) params.set("search", filters.search);
	if (filters.skip !== undefined) params.set("skip", String(filters.skip));
	if (filters.limit !== undefined) params.set("limit", String(filters.limit));
	const queryString = params.toString();
	return queryString ? `?${queryString}` : "";
};

export const fetchIncidents = async (
	filters?: IncidentFilters,
): Promise<IncidentListResponse> => {
	const query = buildQueryParams(filters);
	const response = await apiClient.get<IncidentListResponse>(
		`/incidents${query}`,
	);
	return response.data;
};

export const useIncidents = (filters?: IncidentFilters) => {
	return useQuery({
		queryKey: incidentKeys.list(filters),
		queryFn: () => fetchIncidents(filters),
		placeholderData: keepPreviousData,
	});
};

export const useIncidentDetail = (id: string | null) => {
	return useQuery({
		queryKey: incidentKeys.detail(id || ""),
		queryFn: async () => {
			if (!id) throw new Error("Incident id is required");
			const response = await apiClient.get<IncidentDetail>(`/incidents/${id}`);
			return response.data;
		},
		enabled: Boolean(id),
	});
};

export interface UpdateStatusVariables {
	incidentId: string;
	payload: IncidentStatusUpdateInput;
}

export const useUpdateIncidentStatus = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ incidentId, payload }: UpdateStatusVariables) => {
			const response = await apiClient.patch<IncidentDetail>(
				`/incidents/${incidentId}/status`,
				payload,
			);
			return response.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: incidentKeys.detail(variables.incidentId),
			});
		},
		onError: (_error, variables) => {
			queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: incidentKeys.detail(variables.incidentId),
			});
		},
	});
};

export interface UpdateIncidentVariables {
	incidentId: string;
	payload: IncidentUpdateInput;
}

export const useUpdateIncident = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ incidentId, payload }: UpdateIncidentVariables) => {
			const response = await apiClient.put<IncidentDetail>(
				`/incidents/${incidentId}`,
				payload,
			);
			return response.data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: incidentKeys.detail(variables.incidentId),
			});
		},
		onError: (_error, variables) => {
			queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
			queryClient.invalidateQueries({
				queryKey: incidentKeys.detail(variables.incidentId),
			});
		},
	});
};

export const useCreateIncident = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: IncidentCreateInput) => {
			const response = await apiClient.post<Incident>("/incidents", payload);
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
		},
	});
};
