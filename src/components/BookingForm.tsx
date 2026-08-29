"use client";

import { useState, useMemo } from "react";

export interface Horario {
  horaInicio: string;
  horaFin: string;
  duracionCita: number;
}

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

export default function BookingForm({ horario }: { horario: Horario }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const horasDisponibles = useMemo(
    () => generarHoras(horario.horaInicio, horario.horaFin, horario.duracionCita),
    [horario]
  );

  const hoy = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];

  async function cargarHorasOcupadas(fechaSeleccionada: string) {
    try {
      const res = await fetch(`/api/disponibilidad?fecha=${fechaSeleccionada}`);
      if (!res.ok) throw new Error("No se pudo consultar la disponibilidad");
      const horasCitas: string[] = await res.json();

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
