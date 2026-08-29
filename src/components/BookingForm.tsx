"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { minutosDelDiaEnRD } from "@/lib/fechas";
import {
  generarHoras,
  esDiaLaboral,
  NOMBRES_DIAS,
  type Horario,
} from "@/lib/horario";

export default function BookingForm({
  barbero,
  horario,
  hoy,
}: {
  barbero: { nombre: string; slug: string };
  horario: Horario;
  /** Fecha de hoy en América/Santo_Domingo, calculada en el servidor. */
  hoy: string;
}) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [tokenCita, setTokenCita] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const horasDisponibles = useMemo(
    () => generarHoras(horario.horaInicio, horario.horaFin, horario.duracionCita),
    [horario]
  );

  const diaNoLaboral = fecha !== "" && !esDiaLaboral(fecha, horario.diasLaborales);

  const diasQueTrabaja = horario.diasLaborales
    .map((d) => NOMBRES_DIAS[d])
    .join(", ");

  async function cargarHorasOcupadas(fechaSeleccionada: string) {
    try {
      const res = await fetch(
        `/api/disponibilidad?barbero=${encodeURIComponent(barbero.slug)}&fecha=${fechaSeleccionada}`
      );
      if (!res.ok) throw new Error("No se pudo consultar la disponibilidad");
      const horasCitas: string[] = await res.json();

      let horasBloqueadas = horasCitas;

      if (fechaSeleccionada === hoy) {
        const minutosAhora = minutosDelDiaEnRD();
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
    setTokenCita("");
    if (nuevaFecha) await cargarHorasOcupadas(nuevaFecha);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberoSlug: barbero.slug,
          nombreCliente: nombre,
          telefono,
          fecha,
          hora,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al agendar");
        if (res.status === 409 && fecha) await cargarHorasOcupadas(fecha);
        return;
      }

      setTokenCita(data.token);
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

  if (tokenCita) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10">
          <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold">Cita agendada con {barbero.nombre}</p>
          <p className="text-zinc-400 text-sm mt-1">Te esperamos.</p>
        </div>
        <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 text-left">
          <p className="text-zinc-400 text-xs mb-2">
            Guarda este enlace para ver o cancelar tu cita:
          </p>
          <Link
            href={`/cita/${tokenCita}`}
            className="text-amber-400 text-sm break-all hover:text-amber-300 transition-colors"
          >
            Ver mi cita
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setTokenCita("")}
          className="text-zinc-500 text-sm hover:text-zinc-400 transition-colors"
        >
          Agendar otra
        </button>
      </div>
    );
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
        <p className="text-zinc-500 text-xs mt-1">Trabaja: {diasQueTrabaja}</p>
      </div>

      {diaNoLaboral && (
        <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-amber-400 text-sm">
          {barbero.nombre} no trabaja ese día. Elige otra fecha.
        </div>
      )}

      {fecha && !diaNoLaboral && (
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
          {horasDisponibles.every((h) => horasOcupadas.includes(h)) && (
            <p className="text-zinc-500 text-sm mt-3">
              No queda ningún cupo libre ese día.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!hora || loading || diaNoLaboral}
        className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-bold py-3 px-4 transition-all"
      >
        {loading ? "Agendando..." : "Agendar Cita"}
      </button>
    </form>
  );
}
