import apiClient from "@/lib/api/axios";
import type {
  ActivityIntensity,
  ActivityLog,
  ActivityType,
  BiometricIndicatorType,
  BiometricLog,
  MealType,
  Medication,
  MedicationDoseLog,
  MedicationDoseStatus,
  MedicationFrequency,
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

export interface MedicationPayload {
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  reminder_times?: string[];
  notes?: string;
}

export const medicationService = {
  create: async (payload: MedicationPayload): Promise<Medication> => {
    const response = await apiClient.post("/health/medications/", payload);
    return response.data;
  },

  list: async (): Promise<Medication[]> => {
    const response = await apiClient.get("/health/medications/");
    return response.data;
  },

  update: async (id: string, payload: Partial<MedicationPayload & { is_active: boolean }>) => {
    const response = await apiClient.patch(`/health/medications/${id}/`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/health/medications/${id}/`);
  },
};

export const medicationDoseLogService = {
  create: async (medication: string, status: MedicationDoseStatus): Promise<MedicationDoseLog> => {
    const response = await apiClient.post("/health/medication-dose-logs/", {
      medication,
      status,
    });
    return response.data;
  },

  list: async (): Promise<MedicationDoseLog[]> => {
    const response = await apiClient.get("/health/medication-dose-logs/");
    return response.data;
  },
};

export interface BiometricLogPayload {
  indicator_type: BiometricIndicatorType;
  value: number;
  secondary_value?: number;
  notes?: string;
}

export const biometricLogService = {
  create: async (payload: BiometricLogPayload): Promise<BiometricLog> => {
    const response = await apiClient.post("/health/biometric-logs/", payload);
    return response.data;
  },

  list: async (): Promise<BiometricLog[]> => {
    const response = await apiClient.get("/health/biometric-logs/");
    return response.data;
  },
};
