"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import {
  ACTIVITY_INTENSITY_COLOR,
  ACTIVITY_INTENSITY_LABEL,
  ACTIVITY_INTENSITY_VALUES,
  ACTIVITY_TYPE_LABEL,
  ACTIVITY_TYPE_ORDER,
} from "@/lib/health";
import type { ActivityIntensity, ActivityType } from "@/types";

export interface ActivityLogFormPayload {
  activity_type: ActivityType;
  duration_minutes: number;
  intensity: ActivityIntensity;
  calories_burned?: number;
  notes?: string;
}

export function ActivityLogForm({
  onSubmit,
  onLogged,
}: {
  onSubmit: (payload: ActivityLogFormPayload) => Promise<unknown>;
  onLogged?: () => void;
}) {
  const [activityType, setActivityType] = useState<ActivityType | null>(null);
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState<ActivityIntensity | null>(null);
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setActivityType(null);
    setDuration("");
    setIntensity(null);
    setCalories("");
    setNotes("");
  };

  const durationValue = Number(duration);
  const canSubmit =
    activityType !== null && intensity !== null && duration.trim() !== "" && durationValue > 0;

  const handleSubmit = async () => {
    if (!canSubmit || activityType === null || intensity === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        activity_type: activityType,
        duration_minutes: durationValue,
        intensity,
        ...(calories.trim() ? { calories_burned: Number(calories) } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      reset();
      onLogged?.();
    } catch (err) {
      setError(
        isAxiosError(err)
          ? "No se pudo registrar la actividad. Intenta de nuevo."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (activityType === null) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {ACTIVITY_TYPE_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setActivityType(value)}
            className="text-xs px-2 py-2 rounded border border-[#2A2A2A] text-[#EAE6DD] transition-colors hover:border-[#C8A96B]/50"
          >
            {ACTIVITY_TYPE_LABEL[value]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#EAE6DD]">{ACTIVITY_TYPE_LABEL[activityType]}</span>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[#5A6A5A] hover:text-[#C8A96B]"
        >
          Cambiar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Minutos</p>
          <input
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="30"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
          />
        </div>
        <div>
          <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">
            Calorías (opcional)
          </p>
          <input
            type="number"
            min={0}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="300"
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Intensidad</p>
        <div className="grid grid-cols-3 gap-1.5">
          {ACTIVITY_INTENSITY_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setIntensity(value)}
              className={`px-2 py-2 rounded text-xs font-medium transition-colors border ${
                intensity === value
                  ? "bg-[#C8A96B] text-[#0D0D0D] border-[#C8A96B]"
                  : "bg-[#1A1A1A] text-[#EAE6DD] border-[#2A2A2A] hover:border-current"
              }`}
              style={intensity === value ? undefined : { color: ACTIVITY_INTENSITY_COLOR[value] }}
            >
              {ACTIVITY_INTENSITY_LABEL[value]}
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
