"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sleepLogService } from "@/services/health";
import { SLEEP_QUALITY_COLOR, SLEEP_QUALITY_LABEL } from "@/lib/health";
import type { SleepLog } from "@/types";

export default function SleepHistoryPage() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    sleepLogService
      .list()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu historial de sueño.");
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
    const totalDuration = logs.reduce((sum, log) => sum + Number(log.duration_hours), 0);
    const totalQuality = logs.reduce((sum, log) => sum + log.quality, 0);
    return {
      averageDuration: totalDuration / logs.length,
      averageQuality: totalQuality / logs.length,
      totalEntries: logs.length,
    };
  }, [logs]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Historial de sueño</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Duración y calidad noche a noche.</p>
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
          <p className="text-[#5A6A5A] text-sm">Todavía no registraste ninguna noche.</p>
        </div>
      ) : (
        <>
          {summary && (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-[#C8A96B]">
                  {summary.averageDuration.toFixed(1)}h
                </p>
                <p className="text-[#5A6A5A] text-xs mt-1">Duración media</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#EAE6DD]">
                  {summary.averageQuality.toFixed(1)}
                </p>
                <p className="text-[#5A6A5A] text-xs mt-1">Calidad media</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#EAE6DD]">
                  {summary.totalEntries}
                </p>
                <p className="text-[#5A6A5A] text-xs mt-1">Registros</p>
              </div>
            </div>
          )}

          <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg divide-y divide-[#2A2A2A]">
            {logs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-[#EAE6DD]">{log.sleep_date}</p>
                  {log.notes && (
                    <p className="text-xs text-[#5A6A5A] mt-0.5">{log.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm text-[#EAE6DD]">
                    {Number(log.duration_hours).toFixed(1)}h
                  </span>
                  <span
                    className="text-xs px-2 py-1 rounded font-medium"
                    style={{
                      color: SLEEP_QUALITY_COLOR[log.quality],
                      backgroundColor: `${SLEEP_QUALITY_COLOR[log.quality]}1A`,
                    }}
                  >
                    {SLEEP_QUALITY_LABEL[log.quality]}
                  </span>
                </div>
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
