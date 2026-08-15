"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { SLEEP_QUALITY_COLOR, SLEEP_QUALITY_LABEL, SLEEP_QUALITY_VALUES } from "@/lib/health";
import type { SleepQuality } from "@/types";

export interface SleepLogFormPayload {
  duration_hours: number;
  quality: SleepQuality;
  notes?: string;
}

export function SleepLogForm({
  onSubmit,
  onLogged,
}: {
  onSubmit: (payload: SleepLogFormPayload) => Promise<unknown>;
  onLogged?: () => void;
}) {
  const [duration, setDuration] = useState("");
  const [quality, setQuality] = useState<SleepQuality | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationValue = Number(duration);
  const canSubmit = quality !== null && duration.trim() !== "" && durationValue >= 0;

  const handleSubmit = async () => {
    if (!canSubmit || quality === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        duration_hours: durationValue,
        quality,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setDuration("");
      setQuality(null);
      setNotes("");
      onLogged?.();
    } catch (err) {
      setError(
        isAxiosError(err)
          ? "No se pudo registrar el sueño. Intenta de nuevo."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">
          Horas dormidas
        </p>
        <input
          type="number"
          min={0}
          max={24}
          step={0.25}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="7.5"
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
        />
      </div>

      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Calidad</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SLEEP_QUALITY_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setQuality(value)}
              className={`px-2 py-2 rounded text-xs font-medium transition-colors border ${
                quality === value
                  ? "bg-[#C8A96B] text-[#0D0D0D] border-[#C8A96B]"
                  : "bg-[#1A1A1A] text-[#EAE6DD] border-[#2A2A2A] hover:border-current"
              }`}
              style={quality === value ? undefined : { color: SLEEP_QUALITY_COLOR[value] }}
            >
              {SLEEP_QUALITY_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Nota (opcional)"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full bg-[#C8A96B] text-[#0D0D0D] font-semibold px-4 py-2 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Registrando..." : "Registrar"}
      </button>
    </div>
  );
}
