"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { timeBlockService } from "@/services/timeBlocks";
import {
  addUtcDays,
  calculateCoherenceIndex,
  calculateDailyDistribution,
  ENERGY_TAG_COLOR,
  ENERGY_TAG_LABEL,
  ENERGY_TAG_ORDER,
  EXISTENTIAL_CATEGORY_COLOR,
  EXISTENTIAL_CATEGORY_LABEL,
  EXISTENTIAL_CATEGORY_ORDER,
  formatUtcDate,
  toDateKey,
  todayUtc,
  UNASSIGNED_COLOR,
  UNASSIGNED_LABEL,
} from "@/lib/agenda";
import type { EnergyTag, ExistentialCategory, TimeBlock } from "@/types";

function DistributionBar({
  label,
  color,
  minutes,
  wakingMinutes,
}: {
  label: string;
  color: string;
  minutes: number;
  wakingMinutes: number;
}) {
  const pct = wakingMinutes > 0 ? (minutes / wakingMinutes) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span style={{ color }}>{label}</span>
        <span className="text-[#5A6A5A]">{minutes} min</span>
      </div>
      <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AgendaBalancePage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(todayUtc);

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
        if (!cancelled) setError("No se pudo cargar tu balance del día.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedKey = toDateKey(selectedDate);

  const distribution = useMemo(
    () => calculateDailyDistribution(blocks, selectedKey),
    [blocks, selectedKey]
  );
  const coherence = useMemo(
    () => calculateCoherenceIndex(blocks, selectedKey),
    [blocks, selectedKey]
  );

  const coherencePct =
    coherence.coherence_index !== null ? Math.round(coherence.coherence_index * 100) : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Balance del día</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Cómo se repartió tu tiempo de vigilia entre lo que sostiene y lo que nutre.
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
          <p className="text-[#5A6A5A] text-sm">Cargando tu balance...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      ) : (
        <>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <p className="text-4xl font-semibold text-[#C8A96B]">
              {coherencePct !== null ? `${coherencePct}%` : "—"}
            </p>
            <p className="text-[#5A6A5A] text-sm mt-1">
              Índice de coherencia
              {coherence.planned_total === 0 && " (sin bloques planificados este día)"}
            </p>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide">
              Por categoría existencial
            </p>
            {EXISTENTIAL_CATEGORY_ORDER.map((category: ExistentialCategory) => (
              <DistributionBar
                key={category}
                label={EXISTENTIAL_CATEGORY_LABEL[category]}
                color={EXISTENTIAL_CATEGORY_COLOR[category]}
                minutes={distribution.by_category[category]}
                wakingMinutes={distribution.waking_minutes}
              />
            ))}
            <DistributionBar
              label={UNASSIGNED_LABEL}
              color={UNASSIGNED_COLOR}
              minutes={distribution.by_category.UNASSIGNED}
              wakingMinutes={distribution.waking_minutes}
            />
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 space-y-4">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide">Por energía</p>
            {ENERGY_TAG_ORDER.map((tag: EnergyTag) => (
              <DistributionBar
                key={tag}
                label={ENERGY_TAG_LABEL[tag]}
                color={ENERGY_TAG_COLOR[tag]}
                minutes={distribution.by_energy_tag[tag]}
                wakingMinutes={distribution.waking_minutes}
              />
            ))}
            <DistributionBar
              label={UNASSIGNED_LABEL}
              color={UNASSIGNED_COLOR}
              minutes={distribution.by_energy_tag.UNASSIGNED}
              wakingMinutes={distribution.waking_minutes}
            />
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#5A6A5A]">Cumplidos</p>
              <p className="text-[#EAE6DD] text-lg">{coherence.fulfilled}</p>
            </div>
            <div>
              <p className="text-[#5A6A5A]">Reasignados</p>
              <p className="text-[#EAE6DD] text-lg">{coherence.omitted_reassigned}</p>
            </div>
            <div>
              <p className="text-[#5A6A5A]">Omitidos</p>
              <p className="text-[#EAE6DD] text-lg">{coherence.omitted_failed}</p>
            </div>
            <div>
              <p className="text-[#5A6A5A]">Aún planificados</p>
              <p className="text-[#EAE6DD] text-lg">{coherence.still_planned}</p>
            </div>
          </div>
        </>
      )}

      <Link href="/agenda" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver a la agenda
      </Link>
    </div>
  );
}
