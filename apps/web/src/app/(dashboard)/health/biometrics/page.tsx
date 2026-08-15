"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { biometricLogService } from "@/services/health";
import {
  BIOMETRIC_HAS_SECONDARY_VALUE,
  BIOMETRIC_INDICATOR_LABEL,
  BIOMETRIC_INDICATOR_ORDER,
  BIOMETRIC_INDICATOR_UNIT,
} from "@/lib/health";
import type { BiometricIndicatorType, BiometricLog } from "@/types";

function LogBiometricForm({ onLogged }: { onLogged: (log: BiometricLog) => void }) {
  const [indicatorType, setIndicatorType] = useState<BiometricIndicatorType | null>(null);
  const [value, setValue] = useState("");
  const [secondaryValue, setSecondaryValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setIndicatorType(null);
    setValue("");
    setSecondaryValue("");
  };

  const needsSecondary = indicatorType !== null && BIOMETRIC_HAS_SECONDARY_VALUE[indicatorType];
  const canSubmit =
    indicatorType !== null && value.trim() !== "" && (!needsSecondary || secondaryValue.trim() !== "");

  const handleSubmit = async () => {
    if (!canSubmit || indicatorType === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const log = await biometricLogService.create({
        indicator_type: indicatorType,
        value: Number(value),
        ...(needsSecondary ? { secondary_value: Number(secondaryValue) } : {}),
      });
      onLogged(log);
      reset();
    } catch (err) {
      setError(
        isAxiosError(err) ? "No se pudo registrar el indicador." : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (indicatorType === null) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {BIOMETRIC_INDICATOR_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setIndicatorType(value)}
            className="text-xs px-2 py-2 rounded border border-[#2A2A2A] text-[#EAE6DD] transition-colors hover:border-[#C8A96B]/50"
          >
            {BIOMETRIC_INDICATOR_LABEL[value]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#EAE6DD]">{BIOMETRIC_INDICATOR_LABEL[indicatorType]}</span>
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
          <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">
            {needsSecondary ? "Sistólica" : `Valor (${BIOMETRIC_INDICATOR_UNIT[indicatorType]})`}
          </p>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]/50"
          />
        </div>
        {needsSecondary && (
          <div>
            <p className="text-xs text-[#5A6A5A] uppercase tracking-wide mb-2">Diastólica</p>
            <input
              type="number"
              step="0.01"
              value={secondaryValue}
              onChange={(e) => setSecondaryValue(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]/50"
            />
          </div>
        )}
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

export default function BiometricsPage() {
  const [logs, setLogs] = useState<BiometricLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    biometricLogService
      .list()
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar tus indicadores.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const latestByType = useMemo(() => {
    const map = new Map<BiometricIndicatorType, BiometricLog>();
    for (const log of logs) {
      const existing = map.get(log.indicator_type);
      if (!existing || log.recorded_at > existing.recorded_at) {
        map.set(log.indicator_type, log);
      }
    }
    return map;
  }, [logs]);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Indicadores biométricos</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Últimos valores registrados.</p>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
          <p className="text-[#5A6A5A] text-sm">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {BIOMETRIC_INDICATOR_ORDER.map((type) => {
            const latest = latestByType.get(type);
            return (
              <div
                key={type}
                className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-4"
              >
                <p className="text-xs text-[#5A6A5A] uppercase tracking-wide">
                  {BIOMETRIC_INDICATOR_LABEL[type]}
                </p>
                {latest ? (
                  <p className="text-xl font-semibold text-[#EAE6DD] mt-1">
                    {Number(latest.value)}
                    {latest.secondary_value ? `/${Number(latest.secondary_value)}` : ""}
                    <span className="text-xs text-[#5A6A5A] ml-1">
                      {BIOMETRIC_INDICATOR_UNIT[type]}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-[#5A6A5A] mt-1">Sin datos</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
        <h3 className="text-sm font-medium text-[#EAE6DD] mb-4">Registrar indicador</h3>
        <LogBiometricForm onLogged={(log) => setLogs((prev) => [log, ...prev])} />
      </div>

      <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
