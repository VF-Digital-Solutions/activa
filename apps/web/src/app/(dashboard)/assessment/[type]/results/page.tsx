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
import type { AssessmentEvolutionEntry, CapitalDimension } from "@/types";

export default function AssessmentResultsPage() {
  const params = useParams<{ type: string }>();
  const assessmentType = ASSESSMENT_TYPE_SLUGS[params.type];

  const [latest, setLatest] = useState<AssessmentEvolutionEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentType) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    assessmentService
      .evolution(assessmentType)
      .then((data) => {
        if (cancelled) return;
        const last = data.evolution[data.evolution.length - 1] ?? null;
        setLatest(last);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu snapshot de patrimonio interior.");
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
        <p className="text-[#5A6A5A] text-sm">Cargando tu snapshot...</p>
      </div>
    );
  }

  if (error || !latest) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error ?? "Todavía no completaste esta evaluación."}
        </div>
        <Link href="/assessment" className="text-sm text-[#C8A96B] hover:underline">
          ← Volver a evaluaciones
        </Link>
      </div>
    );
  }

  const dimensions = CAPITAL_DIMENSION_ORDER.filter(
    (dimension) => latest.scores_by_dimension[dimension] !== undefined
  ).map((dimension): [CapitalDimension, number] => [
    dimension,
    latest.scores_by_dimension[dimension],
  ]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">
          Tu patrimonio interior
        </h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Snapshot del {latest.snapshot_date}
        </p>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 space-y-5">
        {dimensions.map(([dimension, score]) => (
          <div key={dimension}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-[#EAE6DD]">
                {CAPITAL_DIMENSION_LABEL[dimension]}
              </span>
              <span className="text-[#C8A96B] font-semibold">
                {score.toFixed(1)} / 10
              </span>
            </div>
            <div className="h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C8A96B] transition-all"
                style={{ width: `${(score / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <Link href="/assessment" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver a evaluaciones
      </Link>
    </div>
  );
}
