import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	fetchIncidents,
	incidentKeys,
	useIncidents,
} from "@/entities/incident/api";
import type {
	Incident,
	IncidentCategory,
	IncidentCriticality,
	IncidentDetail,
	IncidentFilters,
	IncidentSortBy,
	IncidentStatus,
} from "@/entities/incident/model/types";
import { type DatePreset, isValidDateRange } from "@/features/triage-filters";
import { PAGE_SIZE } from "./constants";

export interface ActiveConflictState {
	traceId: string | null;
	expectedVersion?: number | null;
	currentVersion?: number | null;
	serverState?: IncidentDetail | Incident | null;
	attemptedState?: {
		title?: string;
		description?: string;
		category?: string;
		criticality?: string;
		status?: string;
		location?: string;
		truck_plate?: string;
		driver_name?: string | null;
		notes?: string | null;
	} | null;
}

export function useCockpitState() {
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [criticality, setCriticality] = useState<IncidentCriticality | "ALL">(
		"ALL",
	);
	const [status, setStatus] = useState<IncidentStatus | "ALL">("ALL");
	const [category, setCategory] = useState<IncidentCategory | "ALL">("ALL");
	const [datePreset, setDatePreset] = useState<DatePreset>("ALL");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");
	const [sortBy, setSortBy] = useState<IncidentSortBy>("criticality_desc");
	const [occConflictTraceId, setOccConflictTraceId] = useState<string | null>(
		null,
	);
	const [activeConflict, setActiveConflict] =
		useState<ActiveConflictState | null>(null);
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

	const handleCategoryChange = (cat: IncidentCategory | "ALL") => {
		setCategory(cat);
		setPage(1);
	};

	const handleDatePresetChange = (preset: DatePreset) => {
		setDatePreset(preset);
		setPage(1);
	};

	const handleDateRangeChange = (from: string, to: string) => {
		setDateFrom(from);
		setDateTo(to);
		setPage(1);
	};

	const handleSortByChange = (val: IncidentSortBy) => {
		setSortBy(val);
		setPage(1);
	};

	const handleResetFilters = () => {
		setSearch("");
		setCriticality("ALL");
		setStatus("ALL");
		setCategory("ALL");
		setDatePreset("ALL");
		setDateFrom("");
		setDateTo("");
		setSortBy("criticality_desc");
		setPage(1);
	};

	const baseFilters: IncidentFilters = useMemo(() => {
		const f: IncidentFilters = { limit: 100 };
		if (status !== "ALL") f.status = status;
		if (category !== "ALL") f.category = category;
		if (search.trim()) f.search = search.trim();
		if (isValidDateRange(dateFrom, dateTo)) {
			if (dateFrom) f.date_from = dateFrom;
			if (dateTo) f.date_to = dateTo;
		}
		return f;
	}, [status, category, search, dateFrom, dateTo]);

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
			sort_by: sortBy,
		};
		if (criticality !== "ALL") f.criticality = criticality;
		if (status !== "ALL") f.status = status;
		if (category !== "ALL") f.category = category;
		if (search.trim()) f.search = search.trim();
		if (isValidDateRange(dateFrom, dateTo)) {
			if (dateFrom) f.date_from = dateFrom;
			if (dateTo) f.date_to = dateTo;
		}
		return f;
	}, [criticality, status, category, search, dateFrom, dateTo, sortBy, page]);

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

	const handleConflictDetected = (
		traceId?: string | null,
		conflictData?: {
			expected_version?: number;
			current_version?: number;
			server_state?: IncidentDetail | Incident | null;
		} | null,
		attempted?: ActiveConflictState["attemptedState"],
	) => {
		const tid = traceId || "occ-detected";
		setOccConflictTraceId(tid);
		setActiveConflict({
			traceId: tid,
			expectedVersion: conflictData?.expected_version ?? null,
			currentVersion:
				conflictData?.current_version ??
				conflictData?.server_state?.version ??
				null,
			serverState: conflictData?.server_state ?? null,
			attemptedState: attempted ?? null,
		});
	};

	const dismissConflict = () => {
		setOccConflictTraceId(null);
		setActiveConflict(null);
	};

	const handleReloadLatest = () => {
		queryClient.invalidateQueries({ queryKey: incidentKeys.all });
		dismissConflict();
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
		category,
		handleCategoryChange,
		datePreset,
		handleDatePresetChange,
		dateFrom,
		dateTo,
		handleDateRangeChange,
		sortBy,
		handleSortByChange,
		handleResetFilters,
		counts,
		filters,
		total,
		page,
		totalPages,
		pageSize: PAGE_SIZE,
		nextPage,
		prevPage,
		occConflictTraceId,
		activeConflict,
		handleConflictDetected,
		dismissConflict,
		handleReloadLatest,
		isCreateModalOpen,
		openCreateModal,
		closeCreateModal,
		handleCreateSuccess,
		editingIncident,
		openEditModal,
		closeEditModal,
	};
}
