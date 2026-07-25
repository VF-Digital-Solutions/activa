"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import Link from "next/link";
import { timeBlockService } from "@/services/timeBlocks";
import {
  addUtcDays,
  blockDateKey,
  ENERGY_TAG_COLOR,
  ENERGY_TAG_LABEL,
  EXISTENTIAL_CATEGORY_COLOR,
  EXISTENTIAL_CATEGORY_LABEL,
  formatUtcDate,
  toDateKey,
  todayUtc,
} from "@/lib/agenda";
import type { DayCloseResult, TimeBlock, TimeBlockStatus } from "@/types";

interface Decision {
  status: "FULFILLED" | "OMITTED";
  replacedBy: string;
}

export default function DayClosePage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DayCloseResult | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayUtc);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

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

  const selectedKey = toDateKey(selectedDate);

  // "Planned for the day" mirrors the backend's coherence-index scope:
  // blocks whose own start_datetime falls on this date (retroactive entries
  // without a start_datetime are never part of a day-close review).
  const plannedForDay = useMemo(
    () =>
      blocks.filter(
        (block) => block.start_datetime && toDateKey(block.start_datetime) === selectedKey
      ),
    [blocks, selectedKey]
  );

  const pending = plannedForDay.filter((b) => b.status === "PLANNED");
  const alreadyResolved = plannedForDay.filter((b) => b.status !== "PLANNED");

  // Candidates for "reassigned to": fulfilled blocks logged that same day,
  // excluding the block being omitted itself.
  const reassignCandidates = useMemo(
    () =>
      blocks.filter(
        (block) => block.status === "FULFILLED" && blockDateKey(block) === selectedKey
      ),
    [blocks, selectedKey]
  );

  const setDecision = (blockId: string, status: TimeBlockStatus) => {
    if (status !== "FULFILLED" && status !== "OMITTED") return;
    setDecisions((current) => ({
      ...current,
      [blockId]: { status, replacedBy: current[blockId]?.replacedBy ?? "" },
    }));
  };

  const setReassignment = (blockId: string, replacedBy: string) => {
    setDecisions((current) => ({
      ...current,
      [blockId]: { status: "OMITTED", replacedBy },
    }));
  };

  const decidedCount = Object.keys(decisions).length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const resolutions = Object.entries(decisions).map(([blockId, decision]) => ({
        block: blockId,
        status: decision.status,
        ...(decision.status === "OMITTED" && decision.replacedBy
          ? { replaced_by: decision.replacedBy }
          : {}),
      }));
      const response = await timeBlockService.dayClose(selectedKey, resolutions);
      setResult(response);
    } catch (err) {
      if (isAxiosError(err)) {
        setError("No se pudo cerrar el día. Revisa las resoluciones e intenta de nuevo.");
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    const coherencePct =
      result.coherence.coherence_index !== null
        ? Math.round(result.coherence.coherence_index * 100)
        : null;

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Día cerrado</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">Balance del {result.date}</p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-4xl font-semibold text-[#C8A96B]">
            {coherencePct !== null ? `${coherencePct}%` : "—"}
          </p>
          <p className="text-[#5A6A5A] text-sm mt-1">Índice de coherencia</p>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#5A6A5A]">Cumplidos</p>
            <p className="text-[#EAE6DD] text-lg">{result.coherence.fulfilled}</p>
          </div>
          <div>
            <p className="text-[#5A6A5A]">Reasignados</p>
            <p className="text-[#EAE6DD] text-lg">{result.coherence.omitted_reassigned}</p>
          </div>
          <div>
            <p className="text-[#5A6A5A]">Omitidos</p>
            <p className="text-[#EAE6DD] text-lg">{result.coherence.omitted_failed}</p>
          </div>
          <div>
            <p className="text-[#5A6A5A]">Aún planificados</p>
            <p className="text-[#EAE6DD] text-lg">{result.coherence.still_planned}</p>
          </div>
        </div>

        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 space-y-2 text-sm">
          <p className="text-[#5A6A5A]">
            {result.distribution.assigned_minutes} de {result.distribution.waking_minutes} min
            de vigilia asignados · {result.distribution.unassigned_minutes} min sin asignar
          </p>
        </div>

        <Link href="/agenda" className="text-sm text-[#C8A96B] hover:underline">
          ← Volver a la agenda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Cerrar el día</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Revisa lo planificado: confirma, omite o reasigna cada bloque.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addUtcDays(d, -1))}
          className="text-sm text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
        >
          ← Anterior
        </button>
        <span className="text-sm text-[#EAE6DD]">
          {formatUtcDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}
        </span>
        <button
          type="button"
          onClick={() => setSelectedDate((d) => addUtcDays(d, 1))}
          className="text-sm text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
        >
          Siguiente →
        </button>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Cargando bloques planificados...</p>
        </div>
      ) : plannedForDay.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">
            No hay bloques planificados para este día.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((block) => {
            const decision = decisions[block.id];
            const categoryColor = EXISTENTIAL_CATEGORY_COLOR[block.existential_category];
            const energyColor = ENERGY_TAG_COLOR[block.energy_tag];

            return (
              <div
                key={block.id}
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4 space-y-3 border-l-4"
                style={{ borderLeftColor: categoryColor }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-[#EAE6DD] font-medium">{block.title}</p>
                  <span className="text-xs text-[#5A6A5A]">
                    {block.duration_minutes} min
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: categoryColor }}>
                    {EXISTENTIAL_CATEGORY_LABEL[block.existential_category]}
                  </span>
                  <span style={{ color: energyColor }}>
                    {ENERGY_TAG_LABEL[block.energy_tag]}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision(block.id, "FULFILLED")}
                    className={`flex-1 text-sm px-3 py-1.5 rounded border transition-colors ${
                      decision?.status === "FULFILLED"
                        ? "bg-[#7FB88A]/20 border-[#7FB88A] text-[#7FB88A]"
                        : "border-[#2A2A2A] text-[#5A6A5A] hover:text-[#EAE6DD]"
                    }`}
                  >
                    Cumplido
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision(block.id, "OMITTED")}
                    className={`flex-1 text-sm px-3 py-1.5 rounded border transition-colors ${
                      decision?.status === "OMITTED"
                        ? "bg-[#C4685A]/20 border-[#C4685A] text-[#C4685A]"
                        : "border-[#2A2A2A] text-[#5A6A5A] hover:text-[#EAE6DD]"
                    }`}
                  >
                    Omitido
                  </button>
                </div>

                {decision?.status === "OMITTED" && (
                  <select
                    value={decision.replacedBy}
                    onChange={(e) => setReassignment(block.id, e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-xs text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]/50"
                  >
                    <option value="">Sin reasignar</option>
                    {reassignCandidates
                      .filter((candidate) => candidate.id !== block.id)
                      .map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          Reasignado a: {candidate.title}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            );
          })}

          {alreadyResolved.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">
                Ya resueltos
              </p>
              <div className="space-y-2">
                {alreadyResolved.map((block) => (
                  <div
                    key={block.id}
                    className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 flex items-center justify-between text-sm"
                  >
                    <span className="text-[#EAE6DD]">{block.title}</span>
                    <span className="text-[#5A6A5A] text-xs">
                      {block.status === "FULFILLED" ? "Cumplido" : "Omitido"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex items-center justify-between">
        <Link href="/agenda" className="text-sm text-[#5A6A5A] hover:text-[#C8A96B]">
          ← Volver a la agenda
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={decidedCount === 0 || submitting}
          className="bg-[#C8A96B] text-[#0D0D0D] font-semibold px-4 py-2 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Cerrando..." : "Cerrar el día"}
        </button>
      </div>
    </div>
  );
}
