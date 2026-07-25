import apiClient from "@/lib/api/axios";
import type { Emotion, EmotionalLog } from "@/types";

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
};
