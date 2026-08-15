import type { SleepQuality } from "@/types";

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
