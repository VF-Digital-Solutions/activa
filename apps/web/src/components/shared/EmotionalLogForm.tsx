"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { EMOTION_COLOR, EMOTION_LABEL, EMOTION_ORDER } from "@/lib/capitals";
import type { Emotion } from "@/types";

const INTENSITY_VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

export interface EmotionalLogPayload {
  emotion: Emotion;
  intensity: number;
  context_note?: string;
}

export function EmotionalLogForm({
  onSubmit,
  onLogged,
}: {
  onSubmit: (payload: EmotionalLogPayload) => Promise<unknown>;
  onLogged?: () => void;
}) {
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEmotion(null);
    setIntensity(null);
    setNote("");
  };

  const handleSubmit = async () => {
    if (!emotion || intensity === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        emotion,
        intensity,
        ...(note.trim() ? { context_note: note.trim() } : {}),
      });
      reset();
      onLogged?.();
    } catch (err) {
      setError(
        isAxiosError(err)
          ? "No se pudo registrar la emoción. Intenta de nuevo."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (emotion === null) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {EMOTION_ORDER.map((value) => {
          const color = EMOTION_COLOR[value];
          return (
            <button
              key={value}
              type="button"
              onClick={() => setEmotion(value)}
              className="text-xs px-2 py-2 rounded border border-[#2A2A2A] transition-colors hover:border-current"
              style={{ color }}
            >
              {EMOTION_LABEL[value]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: EMOTION_COLOR[emotion] }}>
          {EMOTION_LABEL[emotion]}
        </span>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[#5A6A5A] hover:text-[#C8A96B]"
        >
          Cambiar
        </button>
      </div>

      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Intensidad</p>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {INTENSITY_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(value)}
              className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors ${
                intensity === value
                  ? "bg-[#C8A96B] text-[#0D0D0D]"
                  : "bg-[#1A1A1A] text-[#EAE6DD] hover:bg-[#2A2A2A]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Nota (opcional)"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={intensity === null || submitting}
        className="w-full bg-[#C8A96B] text-[#0D0D0D] font-semibold px-4 py-2 rounded text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Registrando..." : "Registrar"}
      </button>
    </div>
  );
}
