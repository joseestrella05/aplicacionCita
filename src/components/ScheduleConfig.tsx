"use client";

import { useState, useEffect } from "react";

interface Config {
  hora_inicio: string;
  hora_fin: string;
  duracion_cita: string;
}

const HORAS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
];

export default function ScheduleConfig() {
  const [config, setConfig] = useState<Config>({
    hora_inicio: "09:00",
    hora_fin: "19:00",
    duracion_cita: "60",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarConfig() {
      try {
        const res = await fetch("/api/configuracion");
        const data = await res.json();
        setConfig({
          hora_inicio: data.hora_inicio || "09:00",
          hora_fin: data.hora_fin || "19:00",
          duracion_cita: data.duracion_cita || "60",
        });
      } catch {
        setError("Error al cargar configuración");
      } finally {
        setLoading(false);
      }
    }
    cargarConfig();
  }, []);

  async function handleSave() {
    setError("");
    setMensaje("");
    setSaving(true);

    try {
      const res1 = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: "hora_inicio", valor: config.hora_inicio }),
      });

      const res2 = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: "hora_fin", valor: config.hora_fin }),
      });

      const res3 = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: "duracion_cita", valor: config.duracion_cita }),
      });

      if (res1.ok && res2.ok && res3.ok) {
        setMensaje("Horario guardado");
      } else {
        setError("Error al guardar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mt-6">
      <h2 className="text-lg font-semibold text-white mb-4">Horario de Trabajo</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Hora inicio</label>
          <select
            value={config.hora_inicio}
            onChange={(e) => setConfig({ ...config, hora_inicio: e.target.value })}
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
            value={config.hora_fin}
            onChange={(e) => setConfig({ ...config, hora_fin: e.target.value })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-1">Duración (min)</label>
          <select
            value={config.duracion_cita}
            onChange={(e) => setConfig({ ...config, duracion_cita: e.target.value })}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="30">30 minutos</option>
            <option value="60">1 hora</option>
            <option value="90">1 hora 30 min</option>
            <option value="120">2 horas</option>
          </select>
        </div>
      </div>

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
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-medium py-2 px-4 text-sm transition-all"
      >
        {saving ? "Guardando..." : "Guardar horario"}
      </button>
    </div>
  );
}
