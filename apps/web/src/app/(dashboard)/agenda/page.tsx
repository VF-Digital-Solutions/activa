"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { agendaService } from "@/services/agenda";
import { useAuthStore } from "@/store/auth";
import type { AgendaItem, AgendaEvent, AgendaEventType } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  reservation: { label: "Reserva", color: "#C8A96B", icon: "●" },
  task: { label: "Tarea", color: "#6B8FC8", icon: "•" },
  habit: { label: "Hábito", color: "#6BC88F", icon: "★" },
  event: { label: "Evento", color: "#A96BC8", icon: "◆" },
  reminder: { label: "Recordatorio", color: "#C86B6B", icon: "🔔" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function formatDayHeader(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatItemTime(item: AgendaItem): string {
  if (item.is_all_day) return "Todo el día";
  const start = new Date(item.starts_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  if (!item.ends_at) return start;
  const end = new Date(item.ends_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return `${start} – ${end}`;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function groupByDay(items: AgendaItem[]): Record<string, AgendaItem[]> {
  return items.reduce<Record<string, AgendaItem[]>>((acc, item) => {
    const key = toDateKey(item.starts_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Pad with nulls at the beginning for weekday alignment (Monday start)
  const _ = days;
  return _;
}

// ── Form schema ───────────────────────────────────────────────────────────────

const eventSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  event_type: z.enum(["PERSONAL", "HOUSEHOLD", "REMINDER"] as const),
  starts_at: z.string().min(1, "La fecha y hora de inicio son requeridas"),
  ends_at: z.string().optional(),
  description: z.string().optional(),
  is_all_day: z.boolean().optional(),
  color: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

// ── Components ────────────────────────────────────────────────────────────────

function AgendaItemCard({ item, onEdit }: { item: AgendaItem; onEdit?: (item: AgendaItem) => void }) {
  const { user } = useAuthStore();
  const cfg = SOURCE_CONFIG[item.source] ?? { label: item.source, color: "#888", icon: "○" };
  const isEditable =
    onEdit &&
    (item.source === "event" || item.source === "reminder") &&
    user?.id === (item.metadata?.created_by as string | undefined);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#111111] border border-[#2A2A2A] hover:border-[#3A3A3A] transition-colors">
      <span className="text-lg mt-0.5" style={{ color: cfg.color }}>
        {cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-[#EAE6DD] truncate">{item.title}</p>
          <div className="flex items-center gap-2 shrink-0">
            {item.status && (
              <span className="text-xs text-[#5A6A5A]">{item.status}</span>
            )}
            {isEditable && (
              <button
                onClick={() => onEdit(item)}
                className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
              >
                Editar
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {!item.is_all_day && (
            <span className="text-xs text-[#5A6A5A]">{formatTime(item.starts_at)}</span>
          )}
          {item.is_all_day && (
            <span className="text-xs text-[#5A6A5A]">Todo el día</span>
          )}
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function ListView({ items, onEditItem }: { items: AgendaItem[]; onEditItem: (item: AgendaItem) => void }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#5A6A5A]">
        <p className="text-4xl mb-3">📅</p>
        <p className="text-sm">No hay eventos en este período</p>
      </div>
    );
  }

  const grouped = groupByDay(items);
  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {sortedDays.map((day) => (
        <div key={day}>
          <h3 className="text-xs uppercase tracking-wider text-[#5A6A5A] mb-3 font-medium capitalize">
            {formatDayHeader(day + "T00:00:00")}
          </h3>
          <div className="space-y-2">
            {grouped[day].map((item) => (
              <AgendaItemCard key={`${item.source}-${item.source_id}`} item={item} onEdit={onEditItem} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CalendarView({
  items,
  year,
  month,
  onMonthChange,
  onEditItem,
}: {
  items: AgendaItem[];
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  onEditItem: (item: AgendaItem) => void;
}) {
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);

  const itemsByDay = useMemo(() => {
    const map: Record<string, AgendaItem[]> = {};
    items.forEach((item) => {
      const key = toDateKey(item.starts_at);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [items]);

  const firstDayOfMonth = new Date(year, month, 1);
  // Monday = 0 offset
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = firstDayOfMonth.toLocaleDateString("es", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (month === 0) onMonthChange(year - 1, 11);
    else onMonthChange(year, month - 1);
  };
  const nextMonth = () => {
    if (month === 11) onMonthChange(year + 1, 0);
    else onMonthChange(year, month + 1);
  };

  return (
    <div>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-[#EAE6DD] capitalize">{monthName}</span>
        <button
          onClick={nextMonth}
          className="p-2 text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="text-center text-xs text-[#5A6A5A] py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayItems = itemsByDay[dateKey] ?? [];
          const isToday = dateKey === toDateKey(new Date().toISOString());

          return (
            <button
              key={dateKey}
              onClick={() => setDayModalDate(dateKey)}
              className={`
                min-h-[3.5rem] rounded-lg flex flex-col items-start justify-start p-1 text-xs transition-colors w-full
                hover:bg-[#1A1A1A] text-[#EAE6DD]
                ${isToday ? "ring-1 ring-[#C8A96B]" : ""}
              `}
            >
              <span className="font-medium w-full text-center">{day}</span>
              {dayItems.length > 0 && (
                <div className="flex flex-col gap-0.5 w-full mt-0.5">
                  {dayItems.slice(0, 2).map((item, idx) => {
                    const cfg = SOURCE_CONFIG[item.source];
                    return (
                      <div key={idx} className="flex items-center gap-0.5 w-full overflow-hidden">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cfg?.color ?? "#888" }}
                        />
                        <span className="truncate text-[10px] leading-tight text-[#B0A898]">
                          {formatItemTime(item)} {item.title}
                        </span>
                      </div>
                    );
                  })}
                  {dayItems.length > 2 && (
                    <span className="text-[10px] text-[#5A6A5A] pl-2">+{dayItems.length - 2} más</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {dayModalDate && (
        <DayEventsModal
          date={dayModalDate}
          items={itemsByDay[dayModalDate] ?? []}
          onClose={() => setDayModalDate(null)}
          onEditItem={(item) => {
            setDayModalDate(null);
            onEditItem(item);
          }}
        />
      )}
    </div>
  );
}

function DayEventsModal({
  date,
  items,
  onClose,
  onEditItem,
}: {
  date: string;
  items: AgendaItem[];
  onClose: () => void;
  onEditItem: (item: AgendaItem) => void;
}) {
  const { user } = useAuthStore();
  const title = new Date(date + "T00:00:00").toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#2A2A2A] rounded-xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
          <h2 className="text-base font-semibold text-[#EAE6DD] capitalize">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto space-y-2">
          {items.length === 0 ? (
            <p className="text-sm text-[#5A6A5A] text-center py-6">Sin eventos este día</p>
          ) : (
            items.map((item) => {
              const cfg = SOURCE_CONFIG[item.source] ?? { label: item.source, color: "#888", icon: "○" };
              const isEditable =
                (item.source === "event" || item.source === "reminder") &&
                user?.id === (item.metadata?.created_by as string | undefined);
              return (
                <div
                  key={`${item.source}-${item.source_id}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-[#0D0D0D] border border-[#2A2A2A]"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-[#EAE6DD]">{item.title}</p>
                      {isEditable && (
                        <button
                          onClick={() => onEditItem(item)}
                          className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors shrink-0"
                        >
                          Editar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#5A6A5A]">{formatItemTime(item)}</span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${cfg.color}22`, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      {item.status && (
                        <span className="text-xs text-[#5A6A5A]">{item.status}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function EditEventModal({
  item,
  onClose,
  onUpdated,
}: {
  item: AgendaItem;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullEvent, setFullEvent] = useState<AgendaEvent | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { event_type: "PERSONAL", is_all_day: false },
  });

  useEffect(() => {
    agendaService.getEvent(String(item.source_id)).then((event) => {
      setFullEvent(event);
      reset({
        title: event.title,
        event_type: event.event_type,
        starts_at: event.starts_at.slice(0, 16),
        ends_at: event.ends_at ? event.ends_at.slice(0, 16) : undefined,
        description: event.description ?? undefined,
        is_all_day: event.is_all_day,
        color: event.color ?? undefined,
      });
      setIsLoading(false);
    }).catch(() => {
      setError("No se pudo cargar el evento.");
      setIsLoading(false);
    });
  }, [item.source_id, reset]);

  const onSubmit = async (data: EventFormData) => {
    if (!fullEvent) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await agendaService.updateEvent(fullEvent.id, {
        ...data,
        ends_at: data.ends_at || null,
      });
      onUpdated();
      onClose();
    } catch {
      setError("No se pudo guardar los cambios. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
          <h2 className="text-base font-semibold text-[#EAE6DD]">Editar evento</h2>
          <button
            onClick={onClose}
            className="text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
          >
            ✕
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div>
              <label className="block text-xs text-[#5A6A5A] mb-1">Título *</label>
              <input
                {...register("title")}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
              />
              {errors.title && (
                <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#5A6A5A] mb-1">Tipo</label>
              <select
                {...register("event_type")}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
              >
                <option value="PERSONAL">Personal</option>
                <option value="HOUSEHOLD">Del hogar</option>
                <option value="REMINDER">Recordatorio</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#5A6A5A] mb-1">Inicio *</label>
                <input
                  {...register("starts_at")}
                  type="datetime-local"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
                />
                {errors.starts_at && (
                  <p className="text-xs text-red-400 mt-1">{errors.starts_at.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-[#5A6A5A] mb-1">Fin</label>
                <input
                  {...register("ends_at")}
                  type="datetime-local"
                  className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#5A6A5A] mb-1">Descripción</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                {...register("is_all_day")}
                type="checkbox"
                className="accent-[#C8A96B]"
              />
              <span className="text-sm text-[#EAE6DD]">Todo el día</span>
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-[#2A2A2A] text-sm text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-lg bg-[#C8A96B] text-[#0D0D0D] text-sm font-medium hover:bg-[#D4B87A] disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function CreateEventModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { event_type: "PERSONAL", is_all_day: false },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await agendaService.createEvent({
        ...data,
        ends_at: data.ends_at || null,
      });
      onCreated();
      onClose();
    } catch {
      setError("No se pudo crear el evento. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A2A]">
          <h2 className="text-base font-semibold text-[#EAE6DD]">Nuevo evento</h2>
          <button
            onClick={onClose}
            className="text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#5A6A5A] mb-1">Título *</label>
            <input
              {...register("title")}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
              placeholder="Nombre del evento"
            />
            {errors.title && (
              <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-[#5A6A5A] mb-1">Tipo</label>
            <select
              {...register("event_type")}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
            >
              <option value="PERSONAL">Personal</option>
              <option value="HOUSEHOLD">Del hogar</option>
              <option value="REMINDER">Recordatorio</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#5A6A5A] mb-1">Inicio *</label>
              <input
                {...register("starts_at")}
                type="datetime-local"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
              />
              {errors.starts_at && (
                <p className="text-xs text-red-400 mt-1">{errors.starts_at.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-[#5A6A5A] mb-1">Fin</label>
              <input
                {...register("ends_at")}
                type="datetime-local"
                className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#5A6A5A] mb-1">Descripción</label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full bg-[#0D0D0D] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B] resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register("is_all_day")}
              type="checkbox"
              className="accent-[#C8A96B]"
            />
            <span className="text-sm text-[#EAE6DD]">Todo el día</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[#2A2A2A] text-sm text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-lg bg-[#C8A96B] text-[#0D0D0D] text-sm font-medium hover:bg-[#D4B87A] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Creando..." : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type ViewMode = "list" | "calendar";
type FilterKey = "reservation" | "task" | "habit" | "event" | "reminder";

const FILTER_OPTIONS: { key: FilterKey; label: string; color: string }[] = [
  { key: "reservation", label: "Reservas", color: "#C8A96B" },
  { key: "task", label: "Tareas", color: "#6B8FC8" },
  { key: "habit", label: "Hábitos", color: "#6BC88F" },
  { key: "event", label: "Eventos", color: "#A96BC8" },
  { key: "reminder", label: "Recordatorios", color: "#C86B6B" },
];

export default function AgendaPage() {
  const now = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, boolean>>({
    reservation: true,
    task: true,
    habit: true,
    event: true,
    reminder: true,
  });
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaItem | null>(null);

  const activeTypes = Object.entries(activeFilters)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const from = new Date(calYear, calMonth, 1).toISOString();
      const to = new Date(calYear, calMonth + 1, 0, 23, 59, 59).toISOString();
      const data = await agendaService.getItems({ from, to, types: activeTypes });
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear, calMonth, JSON.stringify(activeFilters)]);

  const visibleItems = items.filter((item) => activeFilters[item.source as FilterKey]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#EAE6DD] tracking-wide">Agenda</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-[#111111] border border-[#2A2A2A] rounded-lg p-0.5">
            {(["list", "calendar"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-[#C8A96B] text-[#0D0D0D]"
                    : "text-[#5A6A5A] hover:text-[#EAE6DD]"
                }`}
              >
                {mode === "list" ? "Lista" : "Calendario"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-2 bg-[#C8A96B] text-[#0D0D0D] text-sm font-medium rounded-lg hover:bg-[#D4B87A] transition-colors"
          >
            + Evento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeFilters[key]
                ? "border-transparent text-[#0D0D0D]"
                : "border-[#2A2A2A] text-[#5A6A5A] bg-transparent"
            }`}
            style={activeFilters[key] ? { backgroundColor: color } : {}}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeFilters[key] ? "#0D0D0D" : color }}
            />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#C8A96B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === "list" ? (
          <ListView items={visibleItems} onEditItem={setEditingItem} />
        ) : (
          <CalendarView
            items={visibleItems}
            year={calYear}
            month={calMonth}
            onMonthChange={(y, m) => {
              setCalYear(y);
              setCalMonth(m);
            }}
            onEditItem={setEditingItem}
          />
        )}
      </div>

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchItems}
        />
      )}

      {editingItem && (
        <EditEventModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={() => {
            setEditingItem(null);
            fetchItems();
          }}
        />
      )}
    </div>
  );
}
