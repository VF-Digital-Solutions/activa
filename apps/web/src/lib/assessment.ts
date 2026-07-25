import type { AssessmentType, CapitalDimension } from "@/types";

export const ASSESSMENT_TYPE_SLUGS: Record<string, AssessmentType> = {
  "audit-7-areas": "AUDIT_7_AREAS",
  "health-scale-10": "HEALTH_SCALE_10",
};

export const ASSESSMENT_SLUG_BY_TYPE: Record<AssessmentType, string> = {
  AUDIT_7_AREAS: "audit-7-areas",
  HEALTH_SCALE_10: "health-scale-10",
};

export const ASSESSMENT_TYPE_LABEL: Record<AssessmentType, string> = {
  AUDIT_7_AREAS: "Auditoría de las siete áreas",
  HEALTH_SCALE_10: "Escala de salud existencial",
};

export const CAPITAL_DIMENSION_LABEL: Record<CapitalDimension, string> = {
  PHYSICAL: "Físico",
  EMOTIONAL: "Emocional",
  RELATIONAL: "Relacional",
  COGNITIVE: "Cognitivo",
  MORAL: "Moral",
  TRANSCENDENTAL: "Trascendental",
  STRENGTHS: "Fortalezas",
};

// Canonical display order. Key order on scores_by_dimension objects coming
// back from the API is not guaranteed (JSON round-trips through MySQL don't
// preserve insertion order), so any UI listing dimensions must sort by this
// instead of trusting Object.entries() order.
export const CAPITAL_DIMENSION_ORDER: CapitalDimension[] = [
  "PHYSICAL",
  "EMOTIONAL",
  "RELATIONAL",
  "COGNITIVE",
  "MORAL",
  "TRANSCENDENTAL",
  "STRENGTHS",
];

// Fixed categorical order (never cycled/reassigned), first 7 slots of the
// dataviz skill's validated 8-hue dark-mode theme — passes CVD + normal-vision
// separation checks for adjacent line series against this app's #111111
// surface (validated via scripts/validate_palette.js).
export const CAPITAL_DIMENSION_COLOR: Record<CapitalDimension, string> = {
  PHYSICAL: "#3987e5",
  EMOTIONAL: "#d95926",
  RELATIONAL: "#199e70",
  COGNITIVE: "#c98500",
  MORAL: "#d55181",
  TRANSCENDENTAL: "#008300",
  STRENGTHS: "#9085e9",
};
