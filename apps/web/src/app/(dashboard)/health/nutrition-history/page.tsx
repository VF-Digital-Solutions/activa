"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { nutritionLogService } from "@/services/health";
import { MEAL_TYPE_LABEL } from "@/lib/health";
import type { NutritionLog } from "@/types";

export default function NutritionHistoryPage() {
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    nutritionLogService
      .list()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu historial de comidas.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    if (logs.length === 0) return null;
    const totalCalories = logs.reduce((sum, log) => sum + (log.calories ?? 0), 0);
    return { totalCalories, totalEntries: logs.length };
  }, [logs]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Historial de comidas</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Registro de nutrición, comida a comida.</p>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Cargando tu historial...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Todavía no registraste ninguna comida.</p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-[#C8A96B]">
                  {summary.totalCalories || "—"}
                </p>
                <p className="text-[#5A6A5A] text-xs mt-1">Calorías totales</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#EAE6DD]">
                  {summary.totalEntries}
                </p>
                <p className="text-[#5A6A5A] text-xs mt-1">Comidas</p>
              </div>
            </div>
          )}

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg divide-y divide-[#2A2A2A]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#EAE6DD]">{MEAL_TYPE_LABEL[log.meal_type]}</p>
                  <p className="text-xs text-[#5A6A5A] mt-0.5">
                    {new Date(log.recorded_at).toLocaleString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {log.description}
                  </p>
                </div>
                {log.calories !== null && (
                  <span className="text-sm text-[#EAE6DD] shrink-0">{log.calories} cal</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
