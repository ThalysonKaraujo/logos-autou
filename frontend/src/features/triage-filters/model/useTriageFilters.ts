import { useEffect, useMemo, useRef } from "react";
import type {
	IncidentCategory,
	IncidentCriticality,
	IncidentStatus,
} from "@/entities/incident/model/types";
import {
	type CriticalityCounts,
	calculateDateRange,
	type DatePreset,
	hasActiveFilters,
	isValidDateRange,
} from "./triageFilter";

export interface TriageFiltersProps {
	search: string;
	onSearchChange: (search: string) => void;
	selectedCriticality: IncidentCriticality | "ALL";
	onCriticalityChange: (crit: IncidentCriticality | "ALL") => void;
	selectedStatus: IncidentStatus | "ALL";
	onStatusChange: (status: IncidentStatus | "ALL") => void;
	selectedCategory?: IncidentCategory | "ALL";
	onCategoryChange?: (category: IncidentCategory | "ALL") => void;
	datePreset?: DatePreset;
	onDatePresetChange?: (preset: DatePreset) => void;
	dateFrom?: string;
	dateTo?: string;
	onDateRangeChange?: (dateFrom: string, dateTo: string) => void;
	onResetFilters?: () => void;
	counts?: CriticalityCounts;
}

export function useTriageFilters({
	search,
	selectedCriticality,
	selectedStatus,
	onStatusChange,
	selectedCategory = "ALL",
	onCategoryChange,
	datePreset = "ALL",
	onDatePresetChange,
	dateFrom = "",
	dateTo = "",
	onDateRangeChange,
}: TriageFiltersProps) {
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "/" && document.activeElement !== searchInputRef.current) {
				e.preventDefault();
				searchInputRef.current?.focus();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const isFiltering = useMemo(
		() =>
			hasActiveFilters({
				search,
				criticality: selectedCriticality,
				status: selectedStatus,
				category: selectedCategory,
				dateFrom,
				dateTo,
			}),
		[
			search,
			selectedCriticality,
			selectedStatus,
			selectedCategory,
			dateFrom,
			dateTo,
		],
	);

	const hasDateError = useMemo(
		() => !isValidDateRange(dateFrom, dateTo),
		[dateFrom, dateTo],
	);

	const handleStatusSelect = (value: string) => {
		onStatusChange(value as IncidentStatus | "ALL");
	};

	const handleCategorySelect = (value: string) => {
		onCategoryChange?.(value as IncidentCategory | "ALL");
	};

	const handlePresetSelect = (value: string) => {
		const preset = value as DatePreset;
		onDatePresetChange?.(preset);
		if (preset !== "CUSTOM") {
			const range = calculateDateRange(preset);
			onDateRangeChange?.(range.dateFrom, range.dateTo);
		}
	};

	const handleDateFromChange = (value: string) => {
		onDatePresetChange?.("CUSTOM");
		onDateRangeChange?.(value, dateTo);
	};

	const handleDateToChange = (value: string) => {
		onDatePresetChange?.("CUSTOM");
		onDateRangeChange?.(dateFrom, value);
	};

	return {
		searchInputRef,
		selectedCategory,
		datePreset,
		dateFrom,
		dateTo,
		isFiltering,
		hasDateError,
		handleStatusSelect,
		handleCategorySelect,
		handlePresetSelect,
		handleDateFromChange,
		handleDateToChange,
	};
}
