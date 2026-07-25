"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { emotionalLogService } from "@/services/capitals";
import {
  EMOTION_COLOR,
  EMOTION_LABEL,
  TREND_COLOR,
  TREND_LABEL,
} from "@/lib/capitals";
import { toDateKey } from "@/lib/agenda";
import type { EmotionalAggregates, EmotionalLog } from "@/types";

type Window = 7 | 30;

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;
const CHART_PAD_X = 12;
const CHART_PAD_Y = 12;

interface DailyPoint {
  date: string;
  average: number;
}

function IntensityTrendChart({ points }: { points: DailyPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center">
        <p className="text-[#5A6A5A] text-sm">Sin registros en este período.</p>
      </div>
    );
  }

  const plotWidth = CHART_WIDTH - CHART_PAD_X * 2;
  const plotHeight = CHART_HEIGHT - CHART_PAD_Y * 2;

  const xFor = (index: number) =>
    points.length === 1
      ? CHART_PAD_X + plotWidth / 2
      : CHART_PAD_X + (index / (points.length - 1)) * plotWidth;
  // Intensity scale is 1-10; inverted because SVG y grows downward.
  const yFor = (value: number) => CHART_PAD_Y + (1 - (value - 1) / 9) * plotHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.average)}`)
    .join(" ");

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-40"
        role="img"
        aria-label="Tendencia de intensidad emocional"
      >
        <line
          x1={CHART_PAD_X}
          y1={yFor(5.5)}
          x2={CHART_WIDTH - CHART_PAD_X}
          y2={yFor(5.5)}
          stroke="#2A2A2A"
          strokeWidth={1}
        />
        <path d={linePath} fill="none" stroke="#C8A96B" strokeWidth={2} strokeLinecap="round" />
        {points.map((point, index) => (
          <circle
            key={point.date}
            cx={xFor(index)}
            cy={yFor(point.average)}
            r={hoverIndex === index ? 5 : 4}
            fill="#C8A96B"
            stroke="#0D0D0D"
            strokeWidth={1.5}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-xs text-[#5A6A5A] mt-1">
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
      {hovered && (
        <div className="absolute top-0 right-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#EAE6DD]">
          {hovered.date} · {hovered.average.toFixed(1)}
        </div>
      )}
    </div>
  );
}

export default function MoodHistoryPage() {
  const [windowDays, setWindowDays] = useState<Window>(7);
  const [logs, setLogs] = useState<EmotionalLog[]>([]);
  const [aggregates, setAggregates] = useState<EmotionalAggregates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([emotionalLogService.list(), emotionalLogService.aggregates(windowDays)])
      .then(([logsData, aggregatesData]) => {
        if (cancelled) return;
        setLogs(logsData);
        setAggregates(aggregatesData);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu historial emocional.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [windowDays]);

  const dailyPoints = useMemo<DailyPoint[]>(() => {
    if (!aggregates) return [];
    const byDay = new Map<string, number[]>();
    for (const log of logs) {
      const key = toDateKey(log.recorded_at);
      if (key < aggregates.start_date || key > aggregates.end_date) continue;
      const existing = byDay.get(key) ?? [];
      existing.push(log.intensity);
      byDay.set(key, existing);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        average: values.reduce((sum, v) => sum + v, 0) / values.length,
      }));
  }, [logs, aggregates]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Historial emocional</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">
            Tendencia de intensidad y emociones dominantes.
          </p>
        </div>
        <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1">
          {([7, 30] as Window[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setWindowDays(value)}
              className={`px-3 py-1.5 text-sm rounded ${
                windowDays === value
                  ? "bg-[#C8A96B] text-[#0D0D0D]"
                  : "text-[#5A6A5A] hover:text-[#EAE6DD]"
              }`}
            >
              {value}d
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Cargando tu historial...</p>
        </div>
      ) : error || !aggregates ? (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error ?? "No se pudo cargar tu historial."}
        </div>
      ) : (
        <>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-[#C8A96B]">
                {aggregates.average_intensity !== null
                  ? aggregates.average_intensity.toFixed(1)
                  : "—"}
              </p>
              <p className="text-[#5A6A5A] text-xs mt-1">Intensidad media</p>
            </div>
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: TREND_COLOR[aggregates.trend_direction] }}
              >
                {TREND_LABEL[aggregates.trend_direction]}
              </p>
              <p className="text-[#5A6A5A] text-xs mt-1">Tendencia</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#EAE6DD]">
                {aggregates.total_entries}
              </p>
              <p className="text-[#5A6A5A] text-xs mt-1">Registros</p>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-3">
              Intensidad promedio por día
            </p>
            <IntensityTrendChart points={dailyPoints} />
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 space-y-3">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide">
              Emociones dominantes
            </p>
            {aggregates.dominant_emotions.length === 0 ? (
              <p className="text-[#5A6A5A] text-sm">Sin datos suficientes.</p>
            ) : (
              aggregates.dominant_emotions.map((emotion) => {
                const count =
                  aggregates.emotion_counts.find((e) => e.emotion === emotion)?.count ?? 0;
                return (
                  <div key={emotion} className="flex items-center justify-between text-sm">
                    <span style={{ color: EMOTION_COLOR[emotion] }}>
                      {EMOTION_LABEL[emotion]}
                    </span>
                    <span className="text-[#5A6A5A]">
                      {count} registro{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
