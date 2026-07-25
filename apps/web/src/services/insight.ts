import apiClient from "@/lib/api/axios";
import type { IVISnapshot } from "@/types";

export const insightService = {
  // Ordered oldest to newest; the caller takes the last entry for "current".
  trends: async (days = 90): Promise<IVISnapshot[]> => {
    const response = await apiClient.get("/insight/ivi/trends/", { params: { days } });
    return response.data;
  },
};
