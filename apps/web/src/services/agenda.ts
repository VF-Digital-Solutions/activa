import apiClient from "@/lib/api/axios";
import type { AgendaItem, AgendaEvent, AgendaEventType } from "@/types";

export interface GetAgendaParams {
  from?: string;
  to?: string;
  types?: string[];
}

export interface CreateAgendaEventPayload {
  title: string;
  event_type: AgendaEventType;
  starts_at: string;
  description?: string;
  ends_at?: string | null;
  is_all_day?: boolean;
  household_node?: string | null;
  attendee_ids?: string[];
  remind_at?: string | null;
  channels?: string[];
  color?: string;
}

export type UpdateAgendaEventPayload = Partial<CreateAgendaEventPayload>;

export const agendaService = {
  async getItems(params?: GetAgendaParams): Promise<AgendaItem[]> {
    const response = await apiClient.get("/agenda/", { params });
    return response.data;
  },

  async getTodayItems(): Promise<AgendaItem[]> {
    const response = await apiClient.get("/agenda/today/");
    return response.data;
  },

  async getEvents(): Promise<AgendaEvent[]> {
    const response = await apiClient.get("/agenda/events/");
    return response.data;
  },

  async getEvent(id: string): Promise<AgendaEvent> {
    const response = await apiClient.get(`/agenda/events/${id}/`);
    return response.data;
  },

  async createEvent(payload: CreateAgendaEventPayload): Promise<AgendaEvent> {
    const response = await apiClient.post("/agenda/events/", payload);
    return response.data;
  },

  async updateEvent(id: string, payload: UpdateAgendaEventPayload): Promise<AgendaEvent> {
    const response = await apiClient.patch(`/agenda/events/${id}/`, payload);
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/agenda/events/${id}/`);
  },

  async inviteAttendees(id: string, attendeeIds: string[]): Promise<AgendaEvent> {
    const response = await apiClient.post(`/agenda/events/${id}/invite/`, {
      attendee_ids: attendeeIds,
    });
    return response.data;
  },
};
