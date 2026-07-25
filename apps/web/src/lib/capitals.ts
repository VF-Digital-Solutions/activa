import type { Emotion } from "@/types";

export const EMOTION_ORDER: Emotion[] = [
  "JOY",
  "GRATITUDE",
  "CALM",
  "LOVE",
  "PRIDE",
  "SADNESS",
  "ANGER",
  "FEAR",
  "ANXIETY",
  "FRUSTRATION",
  "LONELINESS",
  "SHAME",
];

export const EMOTION_LABEL: Record<Emotion, string> = {
  JOY: "Alegría",
  GRATITUDE: "Gratitud",
  CALM: "Calma",
  LOVE: "Amor",
  PRIDE: "Orgullo",
  SADNESS: "Tristeza",
  ANGER: "Ira",
  FEAR: "Miedo",
  ANXIETY: "Ansiedad",
  FRUSTRATION: "Frustración",
  LONELINESS: "Soledad",
  SHAME: "Vergüenza",
};

const POSITIVE_EMOTIONS: ReadonlySet<Emotion> = new Set([
  "JOY",
  "GRATITUDE",
  "CALM",
  "LOVE",
  "PRIDE",
]);

// Reuses the same valence coloring as the agenda's energy tags (ENERGIZES
// green / DRAINS red) so the two capitals read consistently.
export const EMOTION_COLOR: Record<Emotion, string> = EMOTION_ORDER.reduce(
  (acc, emotion) => ({
    ...acc,
    [emotion]: POSITIVE_EMOTIONS.has(emotion) ? "#7FB88A" : "#C4685A",
  }),
  {} as Record<Emotion, string>
);
