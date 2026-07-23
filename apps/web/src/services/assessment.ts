import apiClient from "@/lib/api/axios";
import type {
  AssessmentAttempt,
  AssessmentResponseRecord,
  AssessmentSnapshot,
  AssessmentType,
} from "@/types";

export const assessmentService = {
  start: async (type: AssessmentType): Promise<AssessmentAttempt> => {
    const response = await apiClient.post("/assessment/start/", { type });
    return response.data;
  },

  answer: async (
    attemptId: string,
    questionId: string,
    score: number
  ): Promise<AssessmentResponseRecord> => {
    const response = await apiClient.post(
      `/assessment/attempts/${attemptId}/answer/`,
      { question: questionId, score }
    );
    return response.data;
  },

  complete: async (attemptId: string): Promise<AssessmentSnapshot> => {
    const response = await apiClient.post(
      `/assessment/attempts/${attemptId}/complete/`
    );
    return response.data;
  },

  evolution: async (type: AssessmentType) => {
    const response = await apiClient.get("/assessment/evolution/", {
      params: { type },
    });
    return response.data;
  },
};
