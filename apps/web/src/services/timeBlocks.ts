import apiClient from "@/lib/api/axios";
import type { TimeBlock, TimeBlockStatus } from "@/types";

export const timeBlockService = {
  list: async (status?: TimeBlockStatus): Promise<TimeBlock[]> => {
    const response = await apiClient.get("/agenda/", {
      params: status ? { status } : undefined,
    });
    return response.data;
  },
};
