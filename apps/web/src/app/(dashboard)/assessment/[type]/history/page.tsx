"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { assessmentService } from "@/services/assessment";
import {
  ASSESSMENT_TYPE_SLUGS,
  CAPITAL_DIMENSION_LABEL,
  CAPITAL_DIMENSION_ORDER,
} from "@/lib/assessment";
import type { AssessmentEvolution, CapitalDimension } from "@/types";

function deltaColor(delta: number): string {
  if (delta > 0) return "text-[#C8A96B]";
  if (delta < 0) return "text-red-400";
  return "text-[#5A6A5A]";
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}`;
  return delta.toFixed(1);
}

export default function AssessmentHistoryPage() {
  const params = useParams<{ type: string }>();
  const assessmentType = ASSESSMENT_TYPE_SLUGS[params.type];

  const [data, setData] = useState<AssessmentEvolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentType) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    assessmentService
      .evolution(assessmentType)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu historial de evaluaciones.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentType]);

  if (!assessmentType) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
        <p className="text-[#5A6A5A] text-sm">Tipo de evaluación desconocido.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
        <p className="text-[#5A6A5A] text-sm">Cargando tu historial...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error ?? "No se pudo cargar tu historial."}
        </div>
        <Link href="/assessment" className="text-sm text-[#C8A96B] hover:underline">
          ← Volver a evaluaciones
        </Link>
      </div>
    );
  }

  const { baseline, evolution } = data;
  const reversedEvolution = [...evolution].reverse();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Historial de evaluación</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          {baseline
            ? `Comparado contra tu línea base del ${baseline.snapshot_date}`
            : "Todavía no tienes una línea base."}
        </p>
      </div>

      {evolution.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Todavía no completaste esta evaluación.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reversedEvolution.map((entry) => {
            const dimensions = CAPITAL_DIMENSION_ORDER.filter(
              (dimension) => entry.scores_by_dimension[dimension] !== undefined
            ).map((dimension): [CapitalDimension, number, number] => [
              dimension,
              entry.scores_by_dimension[dimension],
              entry.deltas[dimension] ?? 0,
            ]);

            return (
              <div
                key={entry.snapshot_date}
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6"
              >
                <p className="text-sm text-[#EAE6DD] font-medium mb-4">
                  {entry.snapshot_date}
                </p>
                <div className="space-y-2">
                  {dimensions.map(([dimension, score, delta]) => (
                    <div
                      key={dimension}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-[#5A6A5A]">
                        {CAPITAL_DIMENSION_LABEL[dimension]}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-[#EAE6DD]">{score.toFixed(1)}</span>
                        <span className={`text-xs ${deltaColor(delta)}`}>
                          {formatDelta(delta)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link href="/assessment" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver a evaluaciones
      </Link>
    </div>
  );
}
