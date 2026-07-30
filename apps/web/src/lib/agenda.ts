import type {
  CoherenceIndex,
  DailyDistribution,
  EnergyTag,
  ExistentialCategory,
  TimeBlock,
  TimeBlockStatus,
} from "@/types";

// The backend runs with TIME_ZONE = "UTC" and buckets every TimeBlock by
// its UTC calendar date (calculate_daily_distribution / coherence use
// __date lookups against a UTC-configured DB connection). Keying and
// navigating dates here must use UTC components throughout — mixing in the
// viewer's local timezone would silently shift blocks logged near UTC
// midnight onto the wrong day for anyone not in UTC.
export function toDateKey(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// Locale-formats a UTC-anchored date without letting the viewer's local
// timezone shift it onto an adjacent day.
export function formatUtcDate(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleDateString("es", { ...options, timeZone: "UTC" });
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

export const ENERGY_TAG_ORDER: EnergyTag[] = ["ENERGIZES", "NEUTRAL", "DRAINS"];

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

export const TIME_BLOCK_STATUS_LABEL: Record<TimeBlockStatus, string> = {
  PLANNED: "Planificado",
  FULFILLED: "Cumplido",
  OMITTED: "Omitido",
};

export const TIME_BLOCK_STATUS_COLOR: Record<TimeBlockStatus, string> = {
  PLANNED: "#6B7A8F",
  FULFILLED: "#7FB88A",
  OMITTED: "#C4685A",
};

// Hora de fin derivada de start_datetime + duration_minutes; null si el
// bloque no tiene horario (registro retroactivo sin start_datetime).
export function blockEndTime(block: TimeBlock): Date | null {
  if (!block.start_datetime) return null;
  return new Date(new Date(block.start_datetime).getTime() + block.duration_minutes * 60000);
}

export const UNASSIGNED_LABEL = "Sin asignar";
export const UNASSIGNED_COLOR = "#3A3A3A";

const DEFAULT_SLEEP_HOURS = 8;

// Client-side mirror of the backend's calculate_daily_distribution
// (apps/agenda/services.py) so a day's balance can be viewed for any date
// without the mutating side effects of POST /agenda/day-close/.
export function calculateDailyDistribution(
  blocks: TimeBlock[],
  date: string,
  sleepHours = DEFAULT_SLEEP_HOURS
): DailyDistribution {
  const wakingMinutes = Math.max(24 - sleepHours, 0) * 60;

  const byCategory = EXISTENTIAL_CATEGORY_ORDER.reduce(
    (acc, category) => ({ ...acc, [category]: 0 }),
    {} as Record<ExistentialCategory | "UNASSIGNED", number>
  );
  const byEnergyTag = ENERGY_TAG_ORDER.reduce(
    (acc, tag) => ({ ...acc, [tag]: 0 }),
    {} as Record<EnergyTag | "UNASSIGNED", number>
  );

  for (const block of blocks) {
    if (block.status !== "FULFILLED" || blockDateKey(block) !== date) continue;
    byCategory[block.existential_category] += block.duration_minutes;
    byEnergyTag[block.energy_tag] += block.duration_minutes;
  }

  const assignedMinutes = EXISTENTIAL_CATEGORY_ORDER.reduce(
    (sum, category) => sum + byCategory[category],
    0
  );
  const unassignedMinutes = Math.max(wakingMinutes - assignedMinutes, 0);

  byCategory.UNASSIGNED = unassignedMinutes;
  byEnergyTag.UNASSIGNED = unassignedMinutes;

  return {
    date,
    waking_minutes: wakingMinutes,
    assigned_minutes: assignedMinutes,
    unassigned_minutes: unassignedMinutes,
    by_category: byCategory,
    by_energy_tag: byEnergyTag,
  };
}

// Client-side mirror of calculate_coherence_index (apps/agenda/services.py).
export function calculateCoherenceIndex(blocks: TimeBlock[], date: string): CoherenceIndex {
  const planned = blocks.filter(
    (block) => block.start_datetime && toDateKey(block.start_datetime) === date
  );

  let fulfilled = 0;
  let omittedReassigned = 0;
  let omittedFailed = 0;
  let stillPlanned = 0;

  for (const block of planned) {
    if (block.status === "FULFILLED") {
      fulfilled += 1;
    } else if (block.status === "OMITTED") {
      if (block.replaced_by) omittedReassigned += 1;
      else omittedFailed += 1;
    } else {
      stillPlanned += 1;
    }
  }

  const resolvedTotal = fulfilled + omittedReassigned + omittedFailed;
  const coherenceIndex = resolvedTotal
    ? Math.round(((fulfilled + omittedReassigned) / resolvedTotal) * 100) / 100
    : null;

  return {
    date,
    planned_total: planned.length,
    fulfilled,
    omitted_reassigned: omittedReassigned,
    omitted_failed: omittedFailed,
    still_planned: stillPlanned,
    coherence_index: coherenceIndex,
  };
}
