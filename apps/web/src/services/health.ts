import apiClient from "@/lib/api/axios";
import type {
  ActivityIntensity,
  ActivityLog,
  ActivityType,
  MealType,
  NutritionLog,
  SleepLog,
  SleepQuality,
} from "@/types";

export interface SleepLogPayload {
  sleep_date?: string;
  bedtime?: string;
  wake_time?: string;
  duration_hours: number | string;
  quality: SleepQuality;
  notes?: string;
}

export const sleepLogService = {
  // POST upserts by sleep_date (defaults to today), matching the journal
  // entry pattern: one entry per calendar day.
  upsert: async (payload: SleepLogPayload): Promise<SleepLog> => {
    const response = await apiClient.post("/health/sleep-logs/", payload);
    return response.data;
  },

  list: async (): Promise<SleepLog[]> => {
    const response = await apiClient.get("/health/sleep-logs/");
    return response.data;
  },
};

export interface ActivityLogPayload {
  activity_type: ActivityType;
  duration_minutes: number;
  intensity: ActivityIntensity;
  calories_burned?: number;
  notes?: string;
}

export const activityLogService = {
  create: async (payload: ActivityLogPayload): Promise<ActivityLog> => {
    const response = await apiClient.post("/health/activity-logs/", payload);
    return response.data;
  },

  list: async (): Promise<ActivityLog[]> => {
    const response = await apiClient.get("/health/activity-logs/");
    return response.data;
  },
};

export interface NutritionLogPayload {
  meal_type: MealType;
  description: string;
  calories?: number;
}

export const nutritionLogService = {
  create: async (payload: NutritionLogPayload): Promise<NutritionLog> => {
    const response = await apiClient.post("/health/nutrition-logs/", payload);
    return response.data;
  },

  list: async (): Promise<NutritionLog[]> => {
    const response = await apiClient.get("/health/nutrition-logs/");
    return response.data;
  },
};
