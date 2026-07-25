"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import { useHouseholdStore } from "@/store/household";
import { assetService } from "@/services/assets";
import { financeService } from "@/services/finances";
import { householdService } from "@/services/households";
import { emotionalLogService } from "@/services/capitals";
import { EMOTION_COLOR, EMOTION_LABEL, EMOTION_ORDER } from "@/lib/capitals";
import type { Asset, Emotion, FinanceAccount, FinanceTransaction, HouseholdNode } from "@/types";

const INTENSITY_VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

function QuickEmotionalLog() {
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);

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
      await emotionalLogService.create({
        emotion,
        intensity,
        ...(note.trim() ? { context_note: note.trim() } : {}),
      });
      reset();
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2500);
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

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#EAE6DD]">¿Cómo te sientes?</h3>
        {justLogged && (
          <span className="text-xs text-[#7FB88A]">Registrado ✓</span>
        )}
      </div>

      {emotion === null ? (
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
      ) : (
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
      )}
    </div>
  );
}

interface DashboardData {
  assets: Asset[];
  accounts: FinanceAccount[];
  transactions: FinanceTransaction[];
  households: HouseholdNode[];
}

function formatCurrency(amount: number, currency = "CLP") {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  });
}

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE: "Gasto",
  TRANSFER: "Transferencia",
};

const ASSET_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  IN_REPAIR: "En reparación",
  INACTIVE: "Inactivo",
  DISPOSED: "Dado de baja",
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { currentHousehold } = useHouseholdStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const householdId = currentHousehold?.id;
      const [assets, accounts, transactions, households] = await Promise.all([
        assetService.list(householdId),
        financeService.listAccounts(householdId),
        financeService.listTransactions(),
        householdService.list(),
      ]);
      setData({ assets, accounts, transactions, households });
    } catch {
      setError("No se pudo cargar el resumen. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  }, [currentHousehold?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const totalBalance = data?.accounts.reduce(
    (sum, acc) => sum + parseFloat(acc.current_balance || "0"),
    0
  ) ?? 0;

  const primaryCurrency = data?.accounts[0]?.currency ?? "CLP";

  const recentTransactions = [...(data?.transactions ?? [])]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 6);

  const activeAssets = data?.assets.filter((a) => a.status === "ACTIVE") ?? [];

  const summaryCards = [
    {
      label: "Activos",
      value: loading ? "—" : String(data?.assets.length ?? 0),
      sub: `${activeAssets.length} activos`,
      href: "/assets",
    },
    {
      label: "Balance",
      value: loading ? "—" : formatCurrency(totalBalance, primaryCurrency),
      sub: `${data?.accounts.length ?? 0} cuenta${(data?.accounts.length ?? 0) !== 1 ? "s" : ""}`,
      href: "/finances",
    },
    {
      label: "Transacciones",
      value: loading ? "—" : String(data?.transactions.length ?? 0),
      sub: "registradas en total",
      href: "/finances",
    },
    {
      label: "Hogares",
      value: loading ? "—" : String(data?.households.length ?? 0),
      sub: currentHousehold ? currentHousehold.name : "sin hogar activo",
      href: "/households",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">
          Bienvenido, {user?.first_name}
        </h2>
        <p className="text-[#5A6A5A] text-sm mt-1">Tu resumen de hoy</p>
      </div>

      <QuickEmotionalLog />

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={load} className="text-red-400 hover:text-red-300 underline text-xs">
            Reintentar
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 hover:border-[#C8A96B]/40 transition-colors group"
          >
            <p className="text-[#5A6A5A] text-xs uppercase tracking-wider mb-2">
              {card.label}
            </p>
            <p className={`text-2xl font-semibold text-[#C8A96B] ${loading ? "opacity-40" : ""}`}>
              {card.value}
            </p>
            <p className="text-[#5A6A5A] text-xs mt-1">{card.sub}</p>
          </Link>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent transactions */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
            <h3 className="text-sm font-medium text-[#EAE6DD]">Últimas transacciones</h3>
            <Link href="/finances" className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors">
              Ver todas
            </Link>
          </div>
          <div className="divide-y divide-[#1A1A1A]">
            {loading && (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex justify-between animate-pulse">
                  <div className="h-3 bg-[#2A2A2A] rounded w-1/2" />
                  <div className="h-3 bg-[#2A2A2A] rounded w-16" />
                </div>
              ))
            )}
            {!loading && recentTransactions.length === 0 && (
              <p className="px-5 py-6 text-[#5A6A5A] text-sm text-center">
                Sin transacciones registradas
              </p>
            )}
            {!loading && recentTransactions.map((tx) => (
              <div key={tx.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-[#EAE6DD] truncate">
                    {tx.description || TRANSACTION_TYPE_LABEL[tx.type]}
                  </p>
                  <p className="text-xs text-[#5A6A5A] mt-0.5">
                    {formatDate(tx.transaction_date)} · {TRANSACTION_TYPE_LABEL[tx.type]}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ml-4 shrink-0 ${
                    tx.type === "INCOME"
                      ? "text-emerald-400"
                      : tx.type === "EXPENSE"
                      ? "text-red-400"
                      : "text-[#C8A96B]"
                  }`}
                >
                  {tx.type === "EXPENSE" ? "−" : tx.type === "INCOME" ? "+" : ""}
                  {formatCurrency(parseFloat(tx.amount), tx.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Assets overview */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
            <h3 className="text-sm font-medium text-[#EAE6DD]">Activos recientes</h3>
            <Link href="/assets" className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-[#1A1A1A]">
            {loading && (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex justify-between animate-pulse">
                  <div className="h-3 bg-[#2A2A2A] rounded w-2/3" />
                  <div className="h-3 bg-[#2A2A2A] rounded w-16" />
                </div>
              ))
            )}
            {!loading && data?.assets.length === 0 && (
              <p className="px-5 py-6 text-[#5A6A5A] text-sm text-center">
                Sin activos registrados
              </p>
            )}
            {!loading && [...(data?.assets ?? [])]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 6)
              .map((asset) => (
                <Link
                  key={asset.id}
                  href={`/assets/${asset.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[#EAE6DD] truncate">{asset.name}</p>
                    <p className="text-xs text-[#5A6A5A] mt-0.5">
                      {asset.category_name ?? "Sin categoría"}
                      {asset.location_in_home ? ` · ${asset.location_in_home}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ml-4 shrink-0 ${
                      asset.status === "ACTIVE"
                        ? "bg-emerald-950 text-emerald-400"
                        : asset.status === "IN_REPAIR"
                        ? "bg-amber-950 text-amber-400"
                        : "bg-[#2A2A2A] text-[#5A6A5A]"
                    }`}
                  >
                    {ASSET_STATUS_LABEL[asset.status]}
                  </span>
                </Link>
              ))}
          </div>
        </div>

      </div>

      {/* Finance accounts */}
      {!loading && (data?.accounts.length ?? 0) > 0 && (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#2A2A2A]">
            <h3 className="text-sm font-medium text-[#EAE6DD]">Cuentas financieras</h3>
            <Link href="/finances" className="text-xs text-[#5A6A5A] hover:text-[#C8A96B] transition-colors">
              Gestionar
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1A1A1A]">
            {data?.accounts.map((acc) => (
              <div key={acc.id} className="bg-[#111111] px-5 py-4">
                <p className="text-xs text-[#5A6A5A] uppercase tracking-wider mb-1">{acc.name}</p>
                <p className="text-lg font-semibold text-[#EAE6DD]">
                  {formatCurrency(parseFloat(acc.current_balance), acc.currency)}
                </p>
                <p className="text-xs text-[#5A6A5A] mt-1">
                  {acc.institution || acc.type}
                  {acc.is_shared && " · Compartida"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
