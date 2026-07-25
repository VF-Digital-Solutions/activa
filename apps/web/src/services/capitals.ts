import apiClient from "@/lib/api/axios";
import type { Emotion, EmotionalAggregates, EmotionalLog, JournalEntry } from "@/types";

export interface CreateEmotionalLogPayload {
  emotion: Emotion;
  intensity: number;
  context_note?: string;
}

export const emotionalLogService = {
  create: async (payload: CreateEmotionalLogPayload): Promise<EmotionalLog> => {
    const response = await apiClient.post("/capitals/emotional-logs/", payload);
    return response.data;
  },

  list: async (): Promise<EmotionalLog[]> => {
    const response = await apiClient.get("/capitals/emotional-logs/");
    return response.data;
  },

  aggregates: async (window: 7 | 30): Promise<EmotionalAggregates> => {
    const response = await apiClient.get("/capitals/emotional-logs/aggregates/", {
      params: { window },
    });
    return response.data;
  },
};

export interface JournalEntryPayload {
  energy_gain?: string;
  energy_drain?: string;
  avoided_conversation?: string;
  attention_needed?: string;
  gratitude?: string;
}

export const journalService = {
  // POST creates or updates today's single entry (one per calendar day).
  upsertToday: async (payload: JournalEntryPayload): Promise<JournalEntry> => {
    const response = await apiClient.post("/capitals/journal-entries/", payload);
    return response.data;
  },
};
