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
