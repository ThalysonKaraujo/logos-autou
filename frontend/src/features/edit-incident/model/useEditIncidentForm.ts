import { useEffect, useState } from "react";
import { useUpdateIncident } from "@/entities/incident/api";
import type {
	IncidentCategory,
	IncidentCriticality,
	IncidentDetail,
} from "@/entities/incident/model/types";
import { useOperator } from "@/features/operator-session";
import { formatPlate, isValidPlate } from "./validation";

export interface UseEditIncidentFormParams {
	incident: IncidentDetail | null;
	isOpen: boolean;
	onClose: () => void;
	onConflictDetected?: (
		requestId: string | null,
		conflictData?: {
			expected_version?: number;
			current_version?: number;
			server_state?: IncidentDetail | null;
		} | null,
		attempted?: {
			title?: string;
			truck_plate?: string;
			driver_name?: string | null;
			category?: IncidentCategory;
			criticality?: IncidentCriticality;
			location?: string;
			description?: string;
			notes?: string | null;
		} | null,
	) => void;
}

export function useEditIncidentForm({
	incident,
	isOpen,
	onClose,
	onConflictDetected,
}: UseEditIncidentFormParams) {
	const { operator } = useOperator();
	const updateMutation = useUpdateIncident();

	const [title, setTitle] = useState("");
	const [truckPlate, setTruckPlate] = useState("");
	const [driverName, setDriverName] = useState("");
	const [category, setCategory] =
		useState<IncidentCategory>("Problema Mecânico");
	const [criticality, setCriticality] = useState<IncidentCriticality>("Alta");
	const [location, setLocation] = useState("");
	const [description, setDescription] = useState("");
	const [notes, setNotes] = useState("");

	const [plateError, setPlateError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	useEffect(() => {
		if (incident && isOpen) {
			setTitle(incident.title);
			setTruckPlate(incident.truck_plate);
			setDriverName(incident.driver_name || "");
			setCategory(incident.category);
			setCriticality(incident.criticality);
			setLocation(incident.location);
			setDescription(incident.description);
			setNotes("");
			setPlateError(null);
			setSubmitError(null);
		}
	}, [incident, isOpen]);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	const handlePlateChange = (value: string) => {
		const formatted = formatPlate(value);
		setTruckPlate(formatted);
		if (plateError && isValidPlate(formatted)) {
			setPlateError(null);
		}
	};

	const handlePlateBlur = () => {
		if (truckPlate && !isValidPlate(truckPlate)) {
			setPlateError("Placa inválida. Utilize o padrão Mercosul (ex: LOG0A10).");
		}
	};

	const handleCategoryChange = (val: string) => {
		setCategory(val as IncidentCategory);
	};

	const handleCriticalityChange = (val: string) => {
		setCriticality(val as IncidentCriticality);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!incident) return;
		setSubmitError(null);

		const formattedPlate = formatPlate(truckPlate);
		if (!isValidPlate(formattedPlate)) {
			setPlateError("Placa inválida. Utilize o padrão Mercosul (ex: LOG0A10).");
			return;
		}

		try {
			await updateMutation.mutateAsync({
				incidentId: incident.id,
				payload: {
					title: title.trim(),
					truck_plate: formattedPlate,
					driver_name: driverName.trim() || "Motorista não identificado",
					category,
					criticality,
					location: location.trim(),
					description: description.trim(),
					expected_version: incident.version,
					version: incident.version,
					analyst_name: operator,
					notes: notes.trim() || null,
				},
			});

			onClose();
		} catch (error: unknown) {
			const err = error as {
				status?: number;
				requestId?: string | null;
				message?: string;
				data?: {
					details?: {
						expected_version?: number;
						current_version?: number;
						server_state?: IncidentDetail | null;
					};
				};
			};
			if (err?.status === 409) {
				onClose();
				onConflictDetected?.(err.requestId || null, err.data?.details || null, {
					title: title.trim(),
					truck_plate: formattedPlate,
					driver_name: driverName.trim() || "Motorista não identificado",
					category,
					criticality,
					location: location.trim(),
					description: description.trim(),
					notes: notes.trim() || null,
				});
			} else {
				setSubmitError(err?.message || "Erro ao salvar alterações do chamado.");
			}
		}
	};

	return {
		operator,
		title,
		setTitle,
		truckPlate,
		handlePlateChange,
		handlePlateBlur,
		driverName,
		setDriverName,
		category,
		handleCategoryChange,
		criticality,
		handleCriticalityChange,
		location,
		setLocation,
		description,
		setDescription,
		notes,
		setNotes,
		plateError,
		submitError,
		handleSubmit,
		isSubmitting: updateMutation.isPending,
	};
}
