"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { MEAL_TYPE_LABEL, MEAL_TYPE_ORDER } from "@/lib/health";
import type { MealType } from "@/types";

export interface NutritionLogFormPayload {
  meal_type: MealType;
  description: string;
  calories?: number;
}

export function NutritionLogForm({
  onSubmit,
  onLogged,
}: {
  onSubmit: (payload: NutritionLogFormPayload) => Promise<unknown>;
  onLogged?: () => void;
}) {
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [description, setDescription] = useState("");
  const [calories, setCalories] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setMealType(null);
    setDescription("");
    setCalories("");
  };

  const canSubmit = mealType !== null && description.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit || mealType === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        meal_type: mealType,
        description: description.trim(),
        ...(calories.trim() ? { calories: Number(calories) } : {}),
      });
      reset();
      onLogged?.();
    } catch (err) {
      setError(
        isAxiosError(err)
          ? "No se pudo registrar la comida. Intenta de nuevo."
          : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (mealType === null) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {MEAL_TYPE_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMealType(value)}
            className="text-xs px-2 py-2 rounded border border-[#2A2A2A] text-[#EAE6DD] transition-colors hover:border-[#C8A96B]/50"
          >
            {MEAL_TYPE_LABEL[value]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#EAE6DD]">{MEAL_TYPE_LABEL[mealType]}</span>
        <button
          type="button"
          onClick={reset}
          className="text-xs text-[#5A6A5A] hover:text-[#C8A96B]"
        >
          Cambiar
        </button>
      </div>

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="¿Qué comiste?"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />

      <div>
        <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">
          Calorías (opcional)
        </p>
        <input
          type="number"
          min={0}
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="500"
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
        />
      </div>

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
