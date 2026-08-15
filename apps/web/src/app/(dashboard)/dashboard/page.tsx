"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { emotionalLogService } from "@/services/capitals";
import { insightService } from "@/services/insight";
import { activityLogService, nutritionLogService, sleepLogService } from "@/services/health";
import { EmotionalLogForm } from "@/components/shared/EmotionalLogForm";
import { SleepLogForm } from "@/components/shared/SleepLogForm";
import { ActivityLogForm } from "@/components/shared/ActivityLogForm";
import { NutritionLogForm } from "@/components/shared/NutritionLogForm";
import type { IVISnapshot } from "@/types";

function QuickEmotionalLog() {
  const [justLogged, setJustLogged] = useState(false);

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#EAE6DD]">¿Cómo te sientes?</h3>
        <div className="flex items-center gap-3">
          {justLogged && (
            <span className="text-xs text-[#7FB88A]">Registrado ✓</span>
          )}
          <Link
            href="/capitals/mood-history"
            className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
          >
            Ver historial
          </Link>
        </div>
      </div>

      <EmotionalLogForm
        onSubmit={(payload) => emotionalLogService.create(payload)}
        onLogged={() => {
          setJustLogged(true);
          setTimeout(() => setJustLogged(false), 2500);
        }}
      />
    </div>
  );
}

function QuickSleepLog() {
  const [justLogged, setJustLogged] = useState(false);

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#EAE6DD]">¿Cómo dormiste?</h3>
        <div className="flex items-center gap-3">
          {justLogged && (
            <span className="text-xs text-[#7FB88A]">Registrado ✓</span>
          )}
          <Link
            href="/health/sleep-history"
            className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
          >
            Ver historial
          </Link>
        </div>
      </div>

      <SleepLogForm
        onSubmit={(payload) => sleepLogService.upsert(payload)}
        onLogged={() => {
          setJustLogged(true);
          setTimeout(() => setJustLogged(false), 2500);
        }}
      />
    </div>
  );
}

function QuickActivityLog() {
  const [justLogged, setJustLogged] = useState(false);

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#EAE6DD]">Actividad física</h3>
        <div className="flex items-center gap-3">
          {justLogged && (
            <span className="text-xs text-[#7FB88A]">Registrado ✓</span>
          )}
          <Link
            href="/health/activity-history"
            className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
          >
            Ver historial
          </Link>
        </div>
      </div>

      <ActivityLogForm
        onSubmit={(payload) => activityLogService.create(payload)}
        onLogged={() => {
          setJustLogged(true);
          setTimeout(() => setJustLogged(false), 2500);
        }}
      />
    </div>
  );
}

function QuickNutritionLog() {
  const [justLogged, setJustLogged] = useState(false);

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#EAE6DD]">¿Qué comiste?</h3>
        <div className="flex items-center gap-3">
          {justLogged && (
            <span className="text-xs text-[#7FB88A]">Registrado ✓</span>
          )}
          <Link
            href="/health/nutrition-history"
            className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors"
          >
            Ver historial
          </Link>
        </div>
      </div>

      <NutritionLogForm
        onSubmit={(payload) => nutritionLogService.create(payload)}
        onLogged={() => {
          setJustLogged(true);
          setTimeout(() => setJustLogged(false), 2500);
        }}
      />
    </div>
  );
}

function IVIHero() {
  const [snapshot, setSnapshot] = useState<IVISnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    insightService
      .trends(30)
      .then((snapshots) => {
        if (!cancelled) setSnapshot(snapshots[snapshots.length - 1] ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar tu Índice Vital Integrado.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-10 text-center">
        <p className="text-[#5A6A5A] text-sm">Calculando tu Índice Vital Integrado...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-10 text-center space-y-3">
        <p className="text-[#EAE6DD] text-sm">
          Aún no calculamos tu Índice Vital Integrado.
        </p>
        <p className="text-[#5A6A5A] text-xs">
          Completa ambas evaluaciones existenciales para comenzar a verlo aquí.
        </p>
        <Link
          href="/assessment"
          className="inline-block text-sm text-[#C8A96B] hover:underline"
        >
          Ir a evaluación →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-10 text-center">
      <p className="text-[#5A6A5A] text-xs uppercase tracking-wider mb-2">
        Índice Vital Integrado
      </p>
      <p className="text-6xl font-semibold text-[#C8A96B]">{snapshot.ivi.toFixed(1)}</p>
      <p className="text-[#5A6A5A] text-xs mt-2">
        Snapshot del {snapshot.snapshot_date}
      </p>

      <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#2A2A2A]">
        <div>
          <p className="text-lg text-[#EAE6DD]">{snapshot.assets.toFixed(1)}</p>
          <p className="text-[#5A6A5A] text-xs mt-1">Activos</p>
        </div>
        <div>
          <p className="text-lg text-[#EAE6DD]">{snapshot.liabilities.toFixed(1)}</p>
          <p className="text-[#5A6A5A] text-xs mt-1">Pasivos</p>
        </div>
        <div>
          <p className="text-lg text-[#EAE6DD]">{snapshot.adaptation.toFixed(1)}</p>
          <p className="text-[#5A6A5A] text-xs mt-1">Adaptación</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <Link href="/insight/breakdown" className="text-sm text-[#C8A96B] hover:underline">
          Ver desglose por capital →
        </Link>
        <Link href="/insight/history" className="text-sm text-[#C8A96B] hover:underline">
          Ver historial →
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">
          Bienvenido, {user?.first_name}
        </h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Tu resumen de hoy</p>
      </div>

      <IVIHero />

      <QuickEmotionalLog />

      <QuickSleepLog />

      <QuickActivityLog />

      <QuickNutritionLog />

      <Link
        href="/health/medications"
        className="block bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 hover:border-[#C8A96B]/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#EAE6DD]">Medicación</h3>
          <span className="text-xs text-[#5A6A5A]">Ver medicaciones →</span>
        </div>
      </Link>
    </div>
  );
}
