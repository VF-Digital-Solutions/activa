"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import Link from "next/link";
import { timeBlockService } from "@/services/timeBlocks";
import {
  addUtcDays,
  blockDateKey,
  blockEndTime,
  ENERGY_TAG_COLOR,
  ENERGY_TAG_LABEL,
  ENERGY_TAG_ORDER,
  EXISTENTIAL_CATEGORY_COLOR,
  EXISTENTIAL_CATEGORY_LABEL,
  EXISTENTIAL_CATEGORY_ORDER,
  formatUtcDate,
  TIME_BLOCK_STATUS_COLOR,
  TIME_BLOCK_STATUS_LABEL,
  toDateKey,
  todayUtc,
} from "@/lib/agenda";
import type { EnergyTag, ExistentialCategory, TimeBlock } from "@/types";

type ViewMode = "day" | "week";
type LogMode = "planned" | "retroactive";

function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

// UTC-anchored: mirrors the backend's UTC date-bucketing, see lib/agenda.ts.
function startOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // Monday = 0
  return addUtcDays(date, -diff);
}

const WEEKDAY_LABEL = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatBlockTime(block: TimeBlock): string {
  if (!block.start_datetime) return "Sin horario";
  return new Date(block.start_datetime).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("es", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TimeBlockCard({ block, onClick }: { block: TimeBlock; onClick?: () => void }) {
  const energyColor = ENERGY_TAG_COLOR[block.energy_tag];
  const categoryColor = EXISTENTIAL_CATEGORY_COLOR[block.existential_category];

  return (
    <div
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 border-l-4 cursor-pointer hover:border-[#3A3A3A] transition-colors"
      style={{ borderLeftColor: categoryColor }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
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

function TimeBlockDetailModal({
  block,
  replacedByTitle,
  onClose,
}: {
  block: TimeBlock;
  replacedByTitle: string | null;
  onClose: () => void;
}) {
  const categoryColor = EXISTENTIAL_CATEGORY_COLOR[block.existential_category];
  const energyColor = ENERGY_TAG_COLOR[block.energy_tag];
  const statusColor = TIME_BLOCK_STATUS_COLOR[block.status];
  const endTime = blockEndTime(block);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111111] border border-[#2A2A2A] rounded-xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-3 p-5 border-b border-[#2A2A2A] border-l-4"
          style={{ borderLeftColor: categoryColor }}
        >
          <h2 className="text-base font-semibold text-[#EAE6DD]">{block.title}</h2>
          <button
            onClick={onClose}
            className="text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <span
              className="text-xs px-2 py-1 rounded"
              style={{ color: categoryColor, backgroundColor: `${categoryColor}22` }}
            >
              {EXISTENTIAL_CATEGORY_LABEL[block.existential_category]}
            </span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{ color: energyColor, backgroundColor: `${energyColor}22` }}
            >
              {ENERGY_TAG_LABEL[block.energy_tag]}
            </span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{ color: statusColor, backgroundColor: `${statusColor}22` }}
            >
              {TIME_BLOCK_STATUS_LABEL[block.status]}
            </span>
          </div>

          <div className="text-sm text-[#EAE6DD] space-y-1">
            {block.start_datetime ? (
              <p>
                {formatDateTime(block.start_datetime)}
                {endTime && ` – ${endTime.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`}
              </p>
            ) : (
              <p className="text-[#5A6A5A]">Registrado sin horario planificado</p>
            )}
            <p className="text-[#5A6A5A] text-xs">{block.duration_minutes} minutos</p>
          </div>

          {block.status === "OMITTED" && block.replaced_by && (
            <p className="text-sm text-[#C8A96B]">
              Reasignado a: {replacedByTitle ?? block.replaced_by}
            </p>
          )}

          <div className="text-xs text-[#5A6A5A] space-y-0.5 pt-2 border-t border-[#2A2A2A]">
            <p>Creado: {formatDateTime(block.created_at)}</p>
            <p>Actualizado: {formatDateTime(block.updated_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewTimeBlockForm({
  defaultDate,
  onCreated,
  onCancel,
}: {
  defaultDate: Date;
  onCreated: (block: TimeBlock) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExistentialCategory | null>(null);
  const [energyTag, setEnergyTag] = useState<EnergyTag | null>(null);
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [mode, setMode] = useState<LogMode>("planned");
  const [startDatetime, setStartDatetime] = useState(() =>
    toLocalDatetimeInputValue(defaultDate)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    title.trim().length > 0 &&
    category !== null &&
    energyTag !== null &&
    Number(durationMinutes) > 0;

  const handleSubmit = async () => {
    if (!isValid || !category || !energyTag) return;

    setSubmitting(true);
    setError(null);
    try {
      const block = await timeBlockService.create({
        title: title.trim(),
        existential_category: category,
        energy_tag: energyTag,
        duration_minutes: Number(durationMinutes),
        ...(mode === "planned"
          ? { start_datetime: new Date(startDatetime).toISOString() }
          : { status: "FULFILLED" }),
      });
      onCreated(block);
    } catch (err) {
      if (isAxiosError(err)) {
        setError("No se pudo guardar el bloque. Revisa los datos e intenta de nuevo.");
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
      <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode("planned")}
          className={`px-3 py-1.5 text-sm rounded ${
            mode === "planned"
              ? "bg-[#C8A96B] text-[#0D0D0D]"
              : "text-[#5A6A5A] hover:text-[#EAE6DD]"
          }`}
        >
          Planificar
        </button>
        <button
          type="button"
          onClick={() => setMode("retroactive")}
          className={`px-3 py-1.5 text-sm rounded ${
            mode === "retroactive"
              ? "bg-[#C8A96B] text-[#0D0D0D]"
              : "text-[#5A6A5A] hover:text-[#EAE6DD]"
          }`}
        >
          Ya lo viví
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="¿Qué hiciste o vas a hacer?"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />

      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Categoría</p>
        <div className="grid grid-cols-2 gap-2">
          {EXISTENTIAL_CATEGORY_ORDER.map((value) => {
            const color = EXISTENTIAL_CATEGORY_COLOR[value];
            const selected = category === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className="text-xs px-3 py-2 rounded border text-left transition-colors"
                style={{
                  borderColor: selected ? color : "#2A2A2A",
                  backgroundColor: selected ? `${color}22` : "transparent",
                  color: selected ? color : "#5A6A5A",
                }}
              >
                {EXISTENTIAL_CATEGORY_LABEL[value]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Energía</p>
        <div className="flex gap-2">
          {ENERGY_TAG_ORDER.map((value) => {
            const color = ENERGY_TAG_COLOR[value];
            const selected = energyTag === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setEnergyTag(value)}
                className="text-xs px-3 py-2 rounded border transition-colors"
                style={{
                  borderColor: selected ? color : "#2A2A2A",
                  backgroundColor: selected ? `${color}22` : "transparent",
                  color: selected ? color : "#5A6A5A",
                }}
              >
                {ENERGY_TAG_LABEL[value]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">
            Duración (min)
          </p>
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]/50"
          />
        </div>
        {mode === "planned" && (
          <div className="flex-1">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Cuándo</p>
            <input
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]/50"
            />
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-[#5A6A5A] hover:text-[#EAE6DD] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="bg-[#C8A96B] text-[#0D0D0D] font-semibold px-4 py-2 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayUtc);
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);

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
    () => Array.from({ length: 7 }, (_, i) => addUtcDays(weekStart, i)),
    [weekStart]
  );

  const selectedKey = toDateKey(selectedDate);
  const dayBlocks = blocksByDate.get(selectedKey) ?? [];

  const replacedByTitle = useMemo(() => {
    if (!selectedBlock?.replaced_by) return null;
    return blocks.find((b) => b.id === selectedBlock.replaced_by)?.title ?? null;
  }, [blocks, selectedBlock]);

  const shiftDate = (deltaDays: number) => {
    setSelectedDate((current) => addUtcDays(current, deltaDays));
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
          onClick={() => setShowForm((v) => !v)}
          className="text-sm text-[#C8A96B] hover:underline"
        >
          {showForm ? "Cancelar" : "+ Nuevo bloque"}
        </button>
        <div className="flex items-center gap-4">
          <Link href="/agenda/balance" className="text-sm text-[#C8A96B] hover:underline">
            Balance del día
          </Link>
          <Link href="/agenda/day-close" className="text-sm text-[#C8A96B] hover:underline">
            Cerrar el día →
          </Link>
        </div>
      </div>

      {showForm && (
        <NewTimeBlockForm
          defaultDate={selectedDate}
          onCreated={(block) => {
            setBlocks((current) => [block, ...current]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

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
            ? formatUtcDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })
            : `${formatUtcDate(weekStart, { day: "numeric", month: "short" })} – ${formatUtcDate(
                addUtcDays(weekStart, 6),
                { day: "numeric", month: "short" }
              )}`}
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
            dayBlocks.map((block) => (
              <TimeBlockCard
                key={block.id}
                block={block}
                onClick={() => setSelectedBlock(block)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekDays.map((day, index) => {
            const key = toDateKey(day);
            const items = blocksByDate.get(key) ?? [];
            return (
              <div
                key={key}
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-3 space-y-2"
              >
                <p className="text-xs text-[#5A6A5A] uppercase tracking-wide">
                  {WEEKDAY_LABEL[index]} {day.getUTCDate()}
                </p>
                {items.length === 0 ? (
                  <p className="text-[#5A6A5A] text-xs">—</p>
                ) : (
                  items.map((block) => (
                    <TimeBlockCard
                      key={block.id}
                      block={block}
                      onClick={() => setSelectedBlock(block)}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedBlock && (
        <TimeBlockDetailModal
          block={selectedBlock}
          replacedByTitle={replacedByTitle}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </div>
  );
}
