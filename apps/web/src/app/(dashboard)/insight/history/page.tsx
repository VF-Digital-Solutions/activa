"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { insightService } from "@/services/insight";
import {
  CAPITAL_DIMENSION_COLOR,
  CAPITAL_DIMENSION_LABEL,
  CAPITAL_DIMENSION_ORDER,
} from "@/lib/assessment";
import type { IVISnapshot } from "@/types";

type RangeDays = 30 | 90 | 365;

const CHART_WIDTH = 600;
const CHART_HEIGHT = 180;
const PAD_X = 12;
const PAD_Y = 14;

function scaleX(index: number, count: number): number {
  const plotWidth = CHART_WIDTH - PAD_X * 2;
  return count <= 1 ? PAD_X + plotWidth / 2 : PAD_X + (index / (count - 1)) * plotWidth;
}

function IVITrendChart({ snapshots }: { snapshots: IVISnapshot[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center">
        <p className="text-[#5A6A5A] text-sm">Sin snapshots en este período.</p>
      </div>
    );
  }

  const values = snapshots.map((s) => s.ivi);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padded = Math.max((max - min) * 0.15, 1);
  const yMin = min - padded;
  const yMax = max + padded;
  const plotHeight = CHART_HEIGHT - PAD_Y * 2;

  const yFor = (value: number) => PAD_Y + (1 - (value - yMin) / (yMax - yMin)) * plotHeight;

  const linePath = snapshots
    .map((s, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, snapshots.length)} ${yFor(s.ivi)}`)
    .join(" ");

  const hovered = hoverIndex !== null ? snapshots[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-44"
        role="img"
        aria-label="Evolución del Índice Vital Integrado"
      >
        <path d={linePath} fill="none" stroke="#C8A96B" strokeWidth={2} strokeLinecap="round" />
        {snapshots.map((s, i) => (
          <circle
            key={s.snapshot_date}
            cx={scaleX(i, snapshots.length)}
            cy={yFor(s.ivi)}
            r={hoverIndex === i ? 5 : 4}
            fill="#C8A96B"
            stroke="#0D0D0D"
            strokeWidth={1.5}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>
      <div className="flex items-center justify-between text-xs text-[#5A6A5A] mt-1">
        <span>{snapshots[0].snapshot_date}</span>
        <span>{snapshots[snapshots.length - 1].snapshot_date}</span>
      </div>
      {hovered && (
        <div className="absolute top-0 right-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-2 py-1 text-xs text-[#EAE6DD]">
          {hovered.snapshot_date} · IVI {hovered.ivi.toFixed(1)}
        </div>
      )}
    </div>
  );
}

function DimensionTrendChart({ snapshots }: { snapshots: IVISnapshot[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const overlayRef = useRef<SVGRectElement | null>(null);

  if (snapshots.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center">
        <p className="text-[#5A6A5A] text-sm">Sin snapshots en este período.</p>
      </div>
    );
  }

  const plotHeight = CHART_HEIGHT - PAD_Y * 2;
  // Fixed 0-10 scale: assets_by_dimension values are audit-question scores.
  const yFor = (value: number) => PAD_Y + (1 - value / 10) * plotHeight;

  const handleMove = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    const index = Math.round(ratio * (snapshots.length - 1));
    setHoverIndex(Math.min(Math.max(index, 0), snapshots.length - 1));
  };

  const hovered = hoverIndex !== null ? snapshots[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-44"
        role="img"
        aria-label="Evolución por capital existencial"
      >
        {CAPITAL_DIMENSION_ORDER.map((dimension) => {
          const path = snapshots
            .map((s, i) => {
              const value = s.assets_by_dimension[dimension];
              if (value === undefined) return null;
              return `${i === 0 ? "M" : "L"} ${scaleX(i, snapshots.length)} ${yFor(value)}`;
            })
            .filter(Boolean)
            .join(" ");
          return (
            <path
              key={dimension}
              d={path}
              fill="none"
              stroke={CAPITAL_DIMENSION_COLOR[dimension]}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
        {hoverIndex !== null && (
          <line
            x1={scaleX(hoverIndex, snapshots.length)}
            y1={PAD_Y}
            x2={scaleX(hoverIndex, snapshots.length)}
            y2={CHART_HEIGHT - PAD_Y}
            stroke="#2A2A2A"
            strokeWidth={1}
          />
        )}
        <rect
          ref={overlayRef}
          x={0}
          y={0}
          width={CHART_WIDTH}
          height={CHART_HEIGHT}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>
      <div className="flex items-center justify-between text-xs text-[#5A6A5A] mt-1">
        <span>{snapshots[0].snapshot_date}</span>
        <span>{snapshots[snapshots.length - 1].snapshot_date}</span>
      </div>

      {/* Legend — color always paired with a text label, never alone. */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {CAPITAL_DIMENSION_ORDER.map((dimension) => (
          <span key={dimension} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CAPITAL_DIMENSION_COLOR[dimension] }}
            />
            <span className="text-[#5A6A5A]">{CAPITAL_DIMENSION_LABEL[dimension]}</span>
          </span>
        ))}
      </div>

      {hovered && (
        <div className="absolute top-0 right-0 bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-xs space-y-1">
          <p className="text-[#EAE6DD] font-medium">{hovered.snapshot_date}</p>
          {CAPITAL_DIMENSION_ORDER.map((dimension) => {
            const value = hovered.assets_by_dimension[dimension];
            if (value === undefined) return null;
            return (
              <div key={dimension} className="flex items-center justify-between gap-3">
                <span style={{ color: CAPITAL_DIMENSION_COLOR[dimension] }}>
                  {CAPITAL_DIMENSION_LABEL[dimension]}
                </span>
                <span className="text-[#EAE6DD]">{value.toFixed(1)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function IVIHistoryPage() {
  const [range, setRange] = useState<RangeDays>(90);
  const [snapshots, setSnapshots] = useState<IVISnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    insightService
      .trends(range)
      .then((data) => {
        if (!cancelled) setSnapshots(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu historial de IVI.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [range]);

  const dimensionSnapshots = useMemo(
    () => snapshots.filter((s) => Object.keys(s.assets_by_dimension).length > 0),
    [snapshots]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[#EAE6DD]">Historial del IVI</h2>
          <p className="text-[#5A6A5A] text-sm mt-1">
            Evolución de tu Índice Vital Integrado y de cada capital.
          </p>
        </div>
        <div className="flex items-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-1">
          {([30, 90, 365] as RangeDays[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 text-sm rounded ${
                range === value
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
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      ) : snapshots.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center space-y-3">
          <p className="text-[#EAE6DD] text-sm">Aún no hay snapshots de tu IVI.</p>
          <Link href="/assessment" className="text-sm text-[#C8A96B] hover:underline">
            Ir a evaluación →
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-3">
              Índice Vital Integrado
            </p>
            <IVITrendChart snapshots={snapshots} />
          </div>

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6">
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-3">Por capital</p>
            <DimensionTrendChart snapshots={dimensionSnapshots} />
          </div>
        </>
      )}

      <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline block">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
