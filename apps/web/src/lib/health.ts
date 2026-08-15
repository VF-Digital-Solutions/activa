import type {
  ActivityIntensity,
  ActivityType,
  MealType,
  MedicationFrequency,
  SleepQuality,
} from "@/types";

export const SLEEP_QUALITY_VALUES: SleepQuality[] = [1, 2, 3, 4, 5];

export const SLEEP_QUALITY_LABEL: Record<SleepQuality, string> = {
  1: "Muy mala",
  2: "Mala",
  3: "Regular",
  4: "Buena",
  5: "Excelente",
};

// Same red→green valence scale used elsewhere (agenda energy tags, capitals
// emotion coloring) so a glance at the color reads consistently across modules.
export const SLEEP_QUALITY_COLOR: Record<SleepQuality, string> = {
  1: "#C4685A",
  2: "#C4685A",
  3: "#C8A96B",
  4: "#7FB88A",
  5: "#7FB88A",
};

export const ACTIVITY_TYPE_ORDER: ActivityType[] = [
  "WALK",
  "RUN",
  "CYCLING",
  "SWIMMING",
  "STRENGTH",
  "YOGA",
  "SPORTS",
  "OTHER",
];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  WALK: "Caminata",
  RUN: "Running",
  CYCLING: "Ciclismo",
  SWIMMING: "Natación",
  STRENGTH: "Fuerza",
  YOGA: "Yoga",
  SPORTS: "Deporte",
  OTHER: "Otra",
};

export const ACTIVITY_INTENSITY_VALUES: ActivityIntensity[] = ["LOW", "MODERATE", "HIGH"];

export const ACTIVITY_INTENSITY_LABEL: Record<ActivityIntensity, string> = {
  LOW: "Baja",
  MODERATE: "Moderada",
  HIGH: "Alta",
};

export const ACTIVITY_INTENSITY_COLOR: Record<ActivityIntensity, string> = {
  LOW: "#5A6A5A",
  MODERATE: "#C8A96B",
  HIGH: "#7FB88A",
};

export const MEAL_TYPE_ORDER: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  BREAKFAST: "Desayuno",
  LUNCH: "Almuerzo",
  DINNER: "Cena",
  SNACK: "Colación",
};

export const MEDICATION_FREQUENCY_ORDER: MedicationFrequency[] = [
  "ONCE_DAILY",
  "TWICE_DAILY",
  "THREE_TIMES_DAILY",
  "WEEKLY",
  "AS_NEEDED",
  "OTHER",
];

export const MEDICATION_FREQUENCY_LABEL: Record<MedicationFrequency, string> = {
  ONCE_DAILY: "Una vez al día",
  TWICE_DAILY: "Dos veces al día",
  THREE_TIMES_DAILY: "Tres veces al día",
  WEEKLY: "Semanal",
  AS_NEEDED: "Según necesidad",
  OTHER: "Otra",
};
