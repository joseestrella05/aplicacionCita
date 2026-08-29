"use client";

import { useState } from "react";
import { NOMBRES_DIAS, generarHoras } from "@/lib/horario";

export interface PerfilHorario {
  horaInicio: string;
  horaFin: string;
  duracionCita: number;
  diasLaborales: number[];
}

const HORAS = Array.from({ length: 18 }, (_, i) =>
  `${String(i + 6).padStart(2, "0")}:00`
);

export default function ScheduleConfig({ inicial }: { inicial: PerfilHorario }) {
  const [config, setConfig] = useState<PerfilHorario>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cupos = generarHoras(config.horaInicio, config.horaFin, config.duracionCita);

  function alternarDia(dia: number) {
    setConfig((c) => ({
      ...c,
      diasLaborales: c.diasLaborales.includes(dia)
        ? c.diasLaborales.filter((d) => d !== dia)
        : [...c.diasLaborales, dia].sort(),
    }));
  }

  async function guardar() {
    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const res = await fetch("/api/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      setMensaje("Horario guardado. Tu link ya lo muestra.");
    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mt-6">
      <h2 className="text-lg font-semibold text-white mb-4">Tu horario</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Hora inicio</label>
          <select
            value={config.horaInicio}
            onChange={(e) => setConfig({ ...config, horaInicio: e.target.value })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Hora fin</label>
          <select
            value={config.horaFin}
            onChange={(e) => setConfig({ ...config, horaFin: e.target.value })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Duración</label>
          <select
            value={config.duracionCita}
            onChange={(e) => setConfig({ ...config, duracionCita: Number(e.target.value) })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value={30}>30 minutos</option>
            <option value={60}>1 hora</option>
            <option value={90}>1 hora 30 min</option>
            <option value={120}>2 horas</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm text-zinc-400 mb-2">Días que trabajas</label>
        <div className="flex flex-wrap gap-2">
          {NOMBRES_DIAS.map((nombre, dia) => {
            const activo = config.diasLaborales.includes(dia);
            return (
              <button
                key={dia}
                type="button"
                onClick={() => alternarDia(dia)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  activo
                    ? "bg-amber-500 text-black"
                    : "bg-zinc-800 text-zinc-500 border border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                {nombre.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-zinc-500 text-xs mt-4">
        {cupos.length === 0
          ? "Con este horario no cabe ninguna cita."
          : `${cupos.length} cupos por día: de ${cupos[0]} a ${cupos[cupos.length - 1]}.`}
      </p>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400 text-sm mt-4">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400 text-sm mt-4">
          {mensaje}
        </div>
      )}

      <button
        onClick={guardar}
        disabled={guardando || config.diasLaborales.length === 0 || cupos.length === 0}
        className="mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-medium py-2 px-4 text-sm transition-all"
      >
        {guardando ? "Guardando..." : "Guardar horario"}
      </button>
    </div>
  );
}
