"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { insightService } from "@/services/insight";
import { emotionalLogService } from "@/services/capitals";
import { CAPITAL_DIMENSION_LABEL, CAPITAL_DIMENSION_ORDER } from "@/lib/assessment";
import type { CapitalDimension, EmotionalAggregates, IVISnapshot } from "@/types";

function DimensionRow({
  dimension,
  score,
  sourceLabel,
  sourceColor,
}: {
  dimension: CapitalDimension;
  score: number;
  sourceLabel: string;
  sourceColor: string;
}) {
  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#EAE6DD]">{CAPITAL_DIMENSION_LABEL[dimension]}</span>
        <span className="text-[#C8A96B] font-semibold text-sm">{score.toFixed(1)} / 10</span>
      </div>
      <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#C8A96B] transition-all"
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span
        className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
        style={{ color: sourceColor, backgroundColor: `${sourceColor}22` }}
      >
        {sourceLabel}
      </span>
    </div>
  );
}

export default function IVIBreakdownPage() {
  const [snapshot, setSnapshot] = useState<IVISnapshot | null>(null);
  const [emotionalAggregates, setEmotionalAggregates] = useState<EmotionalAggregates | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([insightService.trends(30), emotionalLogService.aggregates(7)])
      .then(([snapshots, aggregates]) => {
        if (cancelled) return;
        setSnapshot(snapshots[snapshots.length - 1] ?? null);
        setEmotionalAggregates(aggregates);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el desglose de tu Índice Vital Integrado.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const usesDailyData =
    emotionalAggregates !== null && emotionalAggregates.average_intensity !== null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Desglose por capital</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Cada capital que compone tus activos, y de dónde viene su dato.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Cargando desglose...</p>
        </div>
      ) : error || !snapshot ? (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
            {error ?? "Aún no calculamos tu Índice Vital Integrado."}
          </div>
          <Link href="/assessment" className="text-sm text-[#C8A96B] hover:underline">
            Ir a evaluación →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {CAPITAL_DIMENSION_ORDER.map((dimension) => {
            const score = snapshot.assets_by_dimension[dimension];
            if (score === undefined) return null;

            const isEmotional = dimension === "EMOTIONAL";
            const sourceLabel = isEmotional
              ? usesDailyData
                ? "Datos diarios"
                : "Última evaluación (sin registros recientes)"
              : "Última evaluación";
            const sourceColor = isEmotional && usesDailyData ? "#7FB88A" : "#5A6A5A";

            return (
              <DimensionRow
                key={dimension}
                dimension={dimension}
                score={score}
                sourceLabel={sourceLabel}
                sourceColor={sourceColor}
              />
            );
          })}

          <p className="text-[#5A6A5A] text-xs pt-2">
            El capital emocional se actualiza con tu registro diario cuando hay entradas en
            los últimos 7 días; el resto refleja tu última auditoría de siete áreas.{" "}
            <Link href="/capitals/mood-history" className="text-[#C8A96B] hover:underline">
              Ver historial emocional →
            </Link>
          </p>
        </div>
      )}

      <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline block">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
