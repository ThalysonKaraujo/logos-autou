import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	fetchIncidents,
	incidentKeys,
	useIncidents,
} from "@/entities/incident/api";
import type {
	IncidentCriticality,
	IncidentDetail,
	IncidentFilters,
	IncidentStatus,
} from "@/entities/incident/model/types";
import { PAGE_SIZE } from "./constants";

export function useCockpitState() {
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [criticality, setCriticality] = useState<IncidentCriticality | "ALL">(
		"ALL",
	);
	const [status, setStatus] = useState<IncidentStatus | "ALL">("ALL");
	const [occConflictTraceId, setOccConflictTraceId] = useState<string | null>(
		null,
	);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [editingIncident, setEditingIncident] = useState<IncidentDetail | null>(
		null,
	);
	const [page, setPage] = useState(1);

	const handleSearchChange = (val: string) => {
		setSearch(val);
		setPage(1);
	};

	const handleCriticalityChange = (crit: IncidentCriticality | "ALL") => {
		setCriticality(crit);
		setPage(1);
	};

	const handleStatusChange = (st: IncidentStatus | "ALL") => {
		setStatus(st);
		setPage(1);
	};

	const baseFilters: IncidentFilters = useMemo(() => {
		const f: IncidentFilters = { limit: 100 };
		if (status !== "ALL") f.status = status;
		if (search.trim()) f.search = search.trim();
		return f;
	}, [status, search]);

	const { data: baseIncidents } = useIncidents(baseFilters);

	const counts = useMemo(() => {
		const items = baseIncidents?.items || [];
		return {
			all: baseIncidents?.total ?? items.length,
			alta: items.filter((i) => i.criticality === "Alta").length,
			media: items.filter((i) => i.criticality === "Média").length,
			baixa: items.filter((i) => i.criticality === "Baixa").length,
		};
	}, [baseIncidents]);

	const filters: IncidentFilters = useMemo(() => {
		const f: IncidentFilters = {
			skip: (page - 1) * PAGE_SIZE,
			limit: PAGE_SIZE,
		};
		if (criticality !== "ALL") f.criticality = criticality;
		if (status !== "ALL") f.status = status;
		if (search.trim()) f.search = search.trim();
		return f;
	}, [criticality, status, search, page]);

	const { data: listData } = useIncidents(filters);
	const total = listData?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	useEffect(() => {
		if (page < totalPages) {
			const nextFilters: IncidentFilters = {
				...filters,
				skip: page * PAGE_SIZE,
				limit: PAGE_SIZE,
			};
			queryClient.prefetchQuery({
				queryKey: incidentKeys.list(nextFilters),
				queryFn: () => fetchIncidents(nextFilters),
			});
		}
		if (page > 1) {
			const prevFilters: IncidentFilters = {
				...filters,
				skip: (page - 2) * PAGE_SIZE,
				limit: PAGE_SIZE,
			};
			queryClient.prefetchQuery({
				queryKey: incidentKeys.list(prevFilters),
				queryFn: () => fetchIncidents(prevFilters),
			});
		}
	}, [page, totalPages, filters, queryClient]);

	const handleConflictDetected = (traceId?: string | null) => {
		setOccConflictTraceId(traceId || "occ-detected");
	};

	const dismissConflict = () => {
		setOccConflictTraceId(null);
	};

	const nextPage = () => {
		setPage((p) => Math.min(totalPages, p + 1));
	};

	const prevPage = () => {
		setPage((p) => Math.max(1, p - 1));
	};

	const openCreateModal = () => {
		setIsCreateModalOpen(true);
	};

	const closeCreateModal = () => {
		setIsCreateModalOpen(false);
	};

	const handleCreateSuccess = (incident: { id: string }) => {
		setSelectedId(incident.id);
		setIsCreateModalOpen(false);
	};

	const openEditModal = (incident: IncidentDetail) => {
		setEditingIncident(incident);
	};

	const closeEditModal = () => {
		setEditingIncident(null);
	};

	const clearSelectedIncident = () => {
		setSelectedId(null);
	};

	return {
		selectedId,
		setSelectedId,
		clearSelectedIncident,
		search,
		handleSearchChange,
		criticality,
		handleCriticalityChange,
		status,
		handleStatusChange,
		counts,
		filters,
		total,
		page,
		totalPages,
		pageSize: PAGE_SIZE,
		nextPage,
		prevPage,
		occConflictTraceId,
		handleConflictDetected,
		dismissConflict,
		isCreateModalOpen,
		openCreateModal,
		closeCreateModal,
		handleCreateSuccess,
		editingIncident,
		openEditModal,
		closeEditModal,
	};
}
