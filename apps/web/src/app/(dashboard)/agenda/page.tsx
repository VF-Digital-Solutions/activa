"use client";

import { useEffect, useMemo, useState } from "react";
import { timeBlockService } from "@/services/timeBlocks";
import {
  ENERGY_TAG_COLOR,
  ENERGY_TAG_LABEL,
  EXISTENTIAL_CATEGORY_COLOR,
  EXISTENTIAL_CATEGORY_LABEL,
} from "@/lib/agenda";
import type { TimeBlock } from "@/types";

type ViewMode = "day" | "week";

function toDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA");
}

function blockDateKey(block: TimeBlock): string {
  return toDateKey(block.start_datetime ?? block.created_at);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const WEEKDAY_LABEL = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatBlockTime(block: TimeBlock): string {
  if (!block.start_datetime) return "Sin horario";
  return new Date(block.start_datetime).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TimeBlockCard({ block }: { block: TimeBlock }) {
  const energyColor = ENERGY_TAG_COLOR[block.energy_tag];
  const categoryColor = EXISTENTIAL_CATEGORY_COLOR[block.existential_category];

  return (
    <div
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 border-l-4"
      style={{ borderLeftColor: categoryColor }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[#EAE6DD] font-medium truncate">{block.title}</p>
        <span
          className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0"
          style={{ color: energyColor, backgroundColor: `${energyColor}22` }}
        >
          {ENERGY_TAG_LABEL[block.energy_tag]}
        </span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs">
        <span style={{ color: categoryColor }}>
          {EXISTENTIAL_CATEGORY_LABEL[block.existential_category]}
        </span>
        <span className="text-[#5A6A5A]">
          {formatBlockTime(block)} · {block.duration_minutes} min
        </span>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    timeBlockService
      .list()
      .then((data) => {
        if (!cancelled) setBlocks(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar tus bloques de tiempo.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const blocksByDate = useMemo(() => {
    const map = new Map<string, TimeBlock[]>();
    for (const block of blocks) {
      const key = blockDateKey(block);
      const existing = map.get(key) ?? [];
      existing.push(block);
      map.set(key, existing);
    }
    for (const list of map.values()) {
      list.sort((a, b) =>
        (a.start_datetime ?? a.created_at).localeCompare(b.start_datetime ?? b.created_at)
      );
    }
    return map;
  }, [blocks]);

  const weekStart = useMemo(() => startOfWeek(selectedDate), [selectedDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const selectedKey = toDateKey(selectedDate.toISOString());
  const dayBlocks = blocksByDate.get(selectedKey) ?? [];

  const shiftDate = (deltaDays: number) => {
    setSelectedDate((current) => addDays(current, deltaDays));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Agenda existencial</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">
            Tu tiempo vital, categorizado por lo que sostiene y lo que nutre.
          </p>
        </div>
        <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === "day"
                ? "bg-[#C8A96B] text-[#0D0D0D]"
                : "text-[#5A6A5A] hover:text-[#EAE6DD]"
            }`}
          >
            Día
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === "week"
                ? "bg-[#C8A96B] text-[#0D0D0D]"
                : "text-[#5A6A5A] hover:text-[#EAE6DD]"
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftDate(viewMode === "day" ? -1 : -7)}
          className="text-sm text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-sm text-[#EAE6DD]">
          {viewMode === "day"
            ? selectedDate.toLocaleDateString("es", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : `${weekStart.toLocaleDateString("es", { day: "numeric", month: "short" })} – ${addDays(
                weekStart,
                6
              ).toLocaleDateString("es", { day: "numeric", month: "short" })}`}
        </span>
        <button
          type="button"
          onClick={() => shiftDate(viewMode === "day" ? 1 : 7)}
          className="text-sm text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
        >
          Siguiente →
        </button>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Cargando tu agenda...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      ) : viewMode === "day" ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 space-y-3">
          {dayBlocks.length === 0 ? (
            <p className="text-[#5A6A5A] text-sm text-center py-6">
              Sin bloques de tiempo para este día.
            </p>
          ) : (
            dayBlocks.map((block) => <TimeBlockCard key={block.id} block={block} />)
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const key = toDateKey(day.toISOString());
            const items = blocksByDate.get(key) ?? [];
            return (
              <div
                key={key}
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 space-y-2"
              >
                <p className="text-xs text-[#5A6A5A] uppercase tracking-wide">
                  {WEEKDAY_LABEL[index]} {day.getDate()}
                </p>
                {items.length === 0 ? (
                  <p className="text-[#5A6A5A] text-xs">—</p>
                ) : (
                  items.map((block) => <TimeBlockCard key={block.id} block={block} />)
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
