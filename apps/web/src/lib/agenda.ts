import type { EnergyTag, ExistentialCategory } from "@/types";

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
