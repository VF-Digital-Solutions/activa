"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { assessmentService } from "@/services/assessment";
import { ASSESSMENT_TYPE_SLUGS, CAPITAL_DIMENSION_LABEL } from "@/lib/assessment";
import type { AssessmentAttempt } from "@/types";

const SCALE_VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function AssessmentWizardPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const assessmentType = ASSESSMENT_TYPE_SLUGS[params.type];

  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentType) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    assessmentService
      .start(assessmentType)
      .then((data) => {
        if (!cancelled) setAttempt(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo iniciar la evaluación.");
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
        <p className="text-[#5A6A5A] text-sm">Cargando evaluación...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
        {error ?? "No se pudo cargar la evaluación."}
      </div>
    );
  }

  const questions = attempt.assessment.questions;
  const question = questions[currentIndex];
  const total = questions.length;
  const isLast = currentIndex === total - 1;
  const selectedScore = answers[question.id];

  const handleSelect = (score: number) => {
    setAnswers((prev) => ({ ...prev, [question.id]: score }));
  };

  const handleBack = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = async () => {
    if (selectedScore === undefined) return;

    setSubmitting(true);
    setError(null);
    try {
      await assessmentService.answer(attempt.id, question.id, selectedScore);

      if (isLast) {
        await assessmentService.complete(attempt.id);
        router.push(`/assessment/${params.type}/results?attempt=${attempt.id}`);
        return;
      }

      setCurrentIndex((i) => i + 1);
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        setError("No se pudo guardar tu respuesta. Intenta de nuevo.");
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs text-[#5A6A5A] mb-2">
          <span>{attempt.assessment.title}</span>
          <span>
            Pregunta {currentIndex + 1} de {total}
          </span>
        </div>
        <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C8A96B] transition-all"
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8">
        <p className="text-xs uppercase tracking-wider text-[#C8A96B] mb-3">
          {CAPITAL_DIMENSION_LABEL[question.capital_dimension]}
        </p>
        <p className="text-lg text-[#EAE6DD] mb-8">{question.text}</p>

        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {SCALE_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              className={`aspect-square rounded flex items-center justify-center text-sm font-medium transition-colors ${
                selectedScore === value
                  ? "bg-[#C8A96B] text-[#0D0D0D]"
                  : "bg-[#1A1A1A] text-[#EAE6DD] hover:bg-[#2A2A2A]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-xs mt-4">{error}</p>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0 || submitting}
            className="text-sm text-[#5A6A5A] hover:text-[#C8A96B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={selectedScore === undefined || submitting}
            className="bg-[#C8A96B] text-[#0D0D0D] font-semibold px-6 py-2.5 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Guardando..." : isLast ? "Finalizar" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
