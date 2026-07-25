import type { EnergyTag, ExistentialCategory, TimeBlock } from "@/types";

export function toDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

// Mirrors the backend's retroactive-attribution rule (calculate_daily_distribution):
// a block belongs to its start_datetime's date, or to its created_at's date
// if it was logged retroactively with no start_datetime.
export function blockDateKey(block: TimeBlock): string {
  return toDateKey(block.start_datetime ?? block.created_at);
}

export const EXISTENTIAL_CATEGORY_ORDER: ExistentialCategory[] = [
  "OBLIGATIONS",
  "INNER_NOURISHMENT",
  "BONDS",
  "TRANSCENDENCE",
];

export const EXISTENTIAL_CATEGORY_LABEL: Record<ExistentialCategory, string> = {
  OBLIGATIONS: "Obligaciones",
  INNER_NOURISHMENT: "Nutrición interior",
  BONDS: "Vínculos",
  TRANSCENDENCE: "Trascendencia",
};

// Distinct accent per category, independent of the energy-tag color coding.
export const EXISTENTIAL_CATEGORY_COLOR: Record<ExistentialCategory, string> = {
  OBLIGATIONS: "#6B7A8F",
  INNER_NOURISHMENT: "#C8A96B",
  BONDS: "#B98CC7",
  TRANSCENDENCE: "#7FB88A",
};

export const ENERGY_TAG_LABEL: Record<EnergyTag, string> = {
  ENERGIZES: "Energiza",
  NEUTRAL: "Neutro",
  DRAINS: "Drena",
};

export const ENERGY_TAG_COLOR: Record<EnergyTag, string> = {
  ENERGIZES: "#7FB88A",
  NEUTRAL: "#5A6A5A",
  DRAINS: "#C4685A",
};
