import apiClient from "@/lib/api/axios";
import type {
  DayCloseResolution,
  DayCloseResult,
  EnergyTag,
  ExistentialCategory,
  TimeBlock,
  TimeBlockStatus,
} from "@/types";

export interface CreateTimeBlockPayload {
  title: string;
  existential_category: ExistentialCategory;
  energy_tag: EnergyTag;
  duration_minutes: number;
  start_datetime?: string | null;
  status?: TimeBlockStatus;
}

export const timeBlockService = {
  list: async (status?: TimeBlockStatus): Promise<TimeBlock[]> => {
    const response = await apiClient.get("/agenda/", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  create: async (payload: CreateTimeBlockPayload): Promise<TimeBlock> => {
    const response = await apiClient.post("/agenda/", payload);
    return response.data;
  },

  dayClose: async (
    date: string,
    resolutions: DayCloseResolution[]
  ): Promise<DayCloseResult> => {
    const response = await apiClient.post("/agenda/day-close/", { date, resolutions });
    return response.data;
  },
};
