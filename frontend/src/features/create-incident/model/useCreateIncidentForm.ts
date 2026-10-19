import { useEffect, useState } from "react";
import { useCreateIncident } from "@/entities/incident/api";
import type {
	Incident,
	IncidentCategory,
	IncidentCriticality,
} from "@/entities/incident/model/types";
import { getTodayIsoDate } from "@/shared/lib";
import { formatPlate, isValidPlate } from "./validation";

export const CREATE_CATEGORIES: ReadonlyArray<IncidentCategory> = [
	"Acidente com Veículo",
	"Acidente com Vítimas",
	"Condição Climática Atípica na Pista",
	"Problema Mecânico",
	"Bloqueio de Pista",
];

export const CREATE_CRITICALITIES: ReadonlyArray<IncidentCriticality> = [
	"Alta",
	"Média",
	"Baixa",
];

export interface CreateIncidentModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: (createdIncident: Incident) => void;
}

export function useCreateIncidentForm({
	isOpen,
	onClose,
	onSuccess,
}: CreateIncidentModalProps) {
	const createMutation = useCreateIncident();

	const [title, setTitle] = useState("");
	const [truckPlate, setTruckPlate] = useState("");
	const [driverName, setDriverName] = useState("");
	const [category, setCategory] =
		useState<IncidentCategory>("Problema Mecânico");
	const [criticality, setCriticality] = useState<IncidentCriticality>("Alta");
	const [incidentDate, setIncidentDate] = useState<string>(() =>
		getTodayIsoDate(),
	);
	const [location, setLocation] = useState("");
	const [description, setDescription] = useState("");

	const [plateError, setPlateError] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

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

	const handleCategoryChange = (value: string) => {
		setCategory(value as IncidentCategory);
	};

	const handleCriticalityChange = (value: string) => {
		setCriticality(value as IncidentCriticality);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitError(null);

		const formattedPlate = formatPlate(truckPlate);
		if (!isValidPlate(formattedPlate)) {
			setPlateError("Placa inválida. Utilize o padrão Mercosul (ex: LOG0A10).");
			return;
		}

		try {
			const created = await createMutation.mutateAsync({
				title: title.trim(),
				truck_plate: formattedPlate,
				driver_name: driverName.trim() || "Motorista não identificado",
				category,
				criticality,
				location: location.trim(),
				description: description.trim(),
				...(incidentDate ? { created_at: incidentDate } : {}),
			});

			setTitle("");
			setTruckPlate("");
			setDriverName("");
			setIncidentDate(getTodayIsoDate());
			setLocation("");
			setDescription("");
			setPlateError(null);
			setSubmitError(null);

			onSuccess?.(created);
			onClose();
		} catch (err: unknown) {
			const message =
				err instanceof Error
					? err.message
					: "Erro ao criar chamado. Tente novamente.";
			setSubmitError(message);
		}
	};

	return {
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
		incidentDate,
		setIncidentDate,
		location,
		setLocation,
		description,
		setDescription,
		plateError,
		submitError,
		handleSubmit,
		isPending: createMutation.isPending,
	};
}
