"use client";

import { useState, useEffect } from "react";

function generarHoras(inicio: string, fin: string, duracion: number): string[] {
  const horas: string[] = [];
  const [hInicio, mInicio] = inicio.split(":").map(Number);
  const [hFin, mFin] = fin.split(":").map(Number);

  let minutosActuales = hInicio * 60 + mInicio;
  const minutosFin = hFin * 60 + mFin;

  while (minutosActuales <= minutosFin) {
    const h = Math.floor(minutosActuales / 60);
    const m = minutosActuales % 60;
    horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minutosActuales += duracion;
  }

  return horas;
}

export default function BookingForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({ hora_inicio: "09:00", hora_fin: "19:00", duracion_cita: "60" });

  const hoy = new Date().toISOString().split("T")[0];

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
        // usar defaults
      }
    }
    cargarConfig();
  }, []);

  useEffect(() => {
    const horas = generarHoras(config.hora_inicio, config.hora_fin, parseInt(config.duracion_cita));
    setHorasDisponibles(horas);
  }, [config]);

  async function cargarHorasOcupadas(fechaSeleccionada: string) {
    try {
      const [resPend, resComp] = await Promise.all([
        fetch(`/api/citas?fecha=${fechaSeleccionada}&estado=pendiente`),
        fetch(`/api/citas?fecha=${fechaSeleccionada}&estado=completada`),
      ]);
      const pendientes = await resPend.json();
      const completadas = await resComp.json();
      const horasCitas = [
        ...pendientes.map((c: { hora: string }) => c.hora),
        ...completadas.map((c: { hora: string }) => c.hora),
      ];

      let horasBloqueadas = horasCitas;

      if (fechaSeleccionada === hoy) {
        const ahora = new Date();
        const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
        horasBloqueadas = [
          ...horasBloqueadas,
          ...horasDisponibles.filter((h) => {
            const [hh, mm] = h.split(":").map(Number);
            return hh * 60 + mm <= minutosAhora;
          }),
        ];
      }

      setHorasOcupadas(horasBloqueadas);
    } catch {
      setHorasOcupadas([]);
    }
  }

  async function handleFechaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nuevaFecha = e.target.value;
    setFecha(nuevaFecha);
    setHora("");
    setError("");
    setMensaje("");
    if (nuevaFecha) await cargarHorasOcupadas(nuevaFecha);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setLoading(true);

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombreCliente: nombre, telefono, fecha, hora }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al agendar");
        return;
      }

      setMensaje("Cita agendada con éxito. Te esperamos!");
      setNombre("");
      setTelefono("");
      setFecha("");
      setHora("");
      setHorasOcupadas([]);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Tu nombre
        </label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Juan Pérez"
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Teléfono
        </label>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          required
          placeholder="809-555-1234"
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">
          Fecha
        </label>
        <input
          type="date"
          value={fecha}
          onChange={handleFechaChange}
          min={hoy}
          required
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
      </div>

      {fecha && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Hora disponible
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {horasDisponibles.map((h) => {
              const ocupada = horasOcupadas.includes(h);
              return (
                <button
                  key={h}
                  type="button"
                  disabled={ocupada}
                  onClick={() => setHora(h)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    ocupada
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed line-through"
                      : hora === h
                      ? "bg-amber-500 text-black ring-2 ring-amber-400"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
                  }`}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-400 text-sm">
          {mensaje}
        </div>
      )}

      <button
        type="submit"
        disabled={!hora || loading}
        className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 px-4 transition-all"
      >
        {loading ? "Agendando..." : "Agendar Cita"}
      </button>
    </form>
  );
}
