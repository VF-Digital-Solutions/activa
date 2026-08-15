"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { medicationDoseLogService, medicationService } from "@/services/health";
import { MEDICATION_FREQUENCY_LABEL, MEDICATION_FREQUENCY_ORDER } from "@/lib/health";
import type { Medication, MedicationFrequency } from "@/types";

function AddMedicationForm({ onAdded }: { onAdded: (medication: Medication) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<MedicationFrequency>("ONCE_DAILY");
  const [reminderTimes, setReminderTimes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim() !== "" && dosage.trim() !== "";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const medication = await medicationService.create({
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        reminder_times: reminderTimes
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onAdded(medication);
      setName("");
      setDosage("");
      setFrequency("ONCE_DAILY");
      setReminderTimes("");
      setOpen(false);
    } catch (err) {
      setError(
        isAxiosError(err) ? "No se pudo agregar la medicación." : "Ocurrió un error inesperado."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-[#2A2A2A] text-[#5A6A5A] hover:text-[#C8A96B] hover:border-[#C8A96B]/50 rounded-lg py-3 text-sm transition-colors"
      >
        + Agregar medicación
      </button>
    );
  }

  return (
    <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-5 space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />
      <input
        type="text"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        placeholder="Dosis (ej. 400mg)"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />
      <select
        value={frequency}
        onChange={(e) => setFrequency(e.target.value as MedicationFrequency)}
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] focus:outline-none focus:border-[#C8A96B]/50"
      >
        {MEDICATION_FREQUENCY_ORDER.map((value) => (
          <option key={value} value={value}>
            {MEDICATION_FREQUENCY_LABEL[value]}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={reminderTimes}
        onChange={(e) => setReminderTimes(e.target.value)}
        placeholder="Horarios, separados por coma (ej. 08:00, 20:00)"
        className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded px-3 py-2 text-sm text-[#EAE6DD] placeholder:text-[#5A6A5A] focus:outline-none focus:border-[#C8A96B]/50"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 border border-[#2A2A2A] text-[#5A6A5A] rounded px-4 py-2 text-sm hover:text-[#EAE6DD] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="flex-1 bg-[#C8A96B] text-[#0D0D0D] font-semibold rounded px-4 py-2 text-sm hover:bg-[#D4B87A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function MedicationRow({
  medication,
  onDeactivated,
}: {
  medication: Medication;
  onDeactivated: (id: string) => void;
}) {
  const [logging, setLogging] = useState<"TAKEN" | "SKIPPED" | null>(null);
  const [lastLogged, setLastLogged] = useState<"TAKEN" | "SKIPPED" | null>(null);

  const logDose = async (status: "TAKEN" | "SKIPPED") => {
    setLogging(status);
    try {
      await medicationDoseLogService.create(medication.id, status);
      setLastLogged(status);
      setTimeout(() => setLastLogged(null), 2500);
    } finally {
      setLogging(null);
    }
  };

  const deactivate = async () => {
    await medicationService.update(medication.id, { is_active: false });
    onDeactivated(medication.id);
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#EAE6DD]">
            {medication.name} <span className="text-[#5A6A5A]">· {medication.dosage}</span>
          </p>
          <p className="text-xs text-[#5A6A5A] mt-0.5">
            {MEDICATION_FREQUENCY_LABEL[medication.frequency]}
            {medication.reminder_times.length > 0
              ? ` · ${medication.reminder_times.join(", ")}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={deactivate}
          className="text-xs text-[#5A6A5A] hover:text-red-400 transition-colors shrink-0"
        >
          Desactivar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => logDose("TAKEN")}
          disabled={logging !== null}
          className="flex-1 bg-[#7FB88A]/15 text-[#7FB88A] rounded px-3 py-1.5 text-xs font-medium hover:bg-[#7FB88A]/25 transition-colors disabled:opacity-50"
        >
          Tomada
        </button>
        <button
          type="button"
          onClick={() => logDose("SKIPPED")}
          disabled={logging !== null}
          className="flex-1 bg-[#C4685A]/15 text-[#C4685A] rounded px-3 py-1.5 text-xs font-medium hover:bg-[#C4685A]/25 transition-colors disabled:opacity-50"
        >
          Omitir
        </button>
        {lastLogged && (
          <span className="text-xs text-[#5A6A5A]">
            {lastLogged === "TAKEN" ? "✓ Registrada" : "✓ Omitida"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    medicationService
      .list()
      .then((data) => {
        if (!cancelled) setMedications(data);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar tus medicaciones.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeMedications = medications.filter((m) => m.is_active);

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#EAE6DD]">Medicación</h2>
        <p className="text-[#5A6A5A] text-sm mt-1">
          Tus medicaciones activas y sus recordatorios.
        </p>
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
        <>
          {activeMedications.length === 0 ? (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg p-8 text-center">
              <p className="text-[#5A6A5A] text-sm">No tenés medicaciones activas.</p>
            </div>
          ) : (
            <div className="bg-[#111111] border border-[#2A2A2A] rounded-lg divide-y divide-[#2A2A2A]">
              {activeMedications.map((medication) => (
                <MedicationRow
                  key={medication.id}
                  medication={medication}
                  onDeactivated={(id) =>
                    setMedications((prev) =>
                      prev.map((m) => (m.id === id ? { ...m, is_active: false } : m))
                    )
                  }
                />
              ))}
            </div>
          )}

          <AddMedicationForm
            onAdded={(medication) => setMedications((prev) => [medication, ...prev])}
          />
        </>
      )}

      <Link href="/dashboard" className="text-sm text-[#C8A96B] hover:underline">
        ← Volver al dashboard
      </Link>
    </div>
  );
}
