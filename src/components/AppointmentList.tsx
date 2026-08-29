"use client";

import { useState, useEffect } from "react";
import { formatearCreadoEn } from "@/lib/fechas";
import { formatearPesos, repartir } from "@/lib/dinero";

interface Cita {
  id: number;
  barberoId: number;
  barberoNombre: string;
  nombreCliente: string;
  telefono: string;
  fecha: string;
  hora: string;
  estado: string;
  montoCobrado: number | null;
  precioAplicado: number | null;
  creadoEn: string;
}

interface BarberoOpcion {
  id: number;
  nombre: string;
}

const ESTADOS = ["pendiente", "completada", "cancelada"];

export default function AppointmentList({
  esAdmin,
  barberos,
  precioPela,
  barberoId,
  onBarberoId,
  onCobro,
}: {
  esAdmin: boolean;
  /** Solo se usa cuando esAdmin: permite ver todos o filtrar por uno. */
  barberos: BarberoOpcion[];
  /** Precio con el que se prellena el campo de cobro. */
  precioPela: number;
  /** El filtro de barbero lo controla el panel: los ingresos miran al mismo. */
  barberoId: string;
  onBarberoId: (id: string) => void;
  /** Avisa al panel para que refresque el resumen de ingresos. */
  onCobro?: () => void;
}) {
  // Cita cuyo cobro se está escribiendo, y el texto del campo.
  const [cobrando, setCobrando] = useState<number | null>(null);
  const [monto, setMonto] = useState("");
  const [filtro, setFiltro] = useState("pendiente");
  // Se guarda junto a la consulta con la que se cargó: así `loading` se
  // deriva y una respuesta lenta de un filtro viejo no pisa a la del nuevo.
  const [datos, setDatos] = useState<{ clave: string; citas: Cita[] } | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");

  const clave = `${filtro}|${barberoId}`;
  const loading = datos === null || datos.clave !== clave;
  const citas = datos?.citas ?? [];

  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const query = new URLSearchParams({ estado: filtro });
        if (barberoId) query.set("barberoId", barberoId);

        const res = await fetch(`/api/citas?${query}`);
        const data = await res.json();
        if (!vigente) return;

        if (!res.ok) {
          setError(data.error || "No se pudieron cargar las citas");
          setDatos({ clave, citas: [] });
          return;
        }

        setError("");
        setDatos({ clave, citas: data });
      } catch {
        if (vigente) setDatos({ clave, citas: [] });
      }
    })();

    return () => {
      vigente = false;
    };
  }, [clave, filtro, barberoId, recarga]);

  async function enviar(cuerpo: Record<string, unknown>) {
    setError("");
    try {
      const res = await fetch("/api/citas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al actualizar");
        return false;
      }
      setRecarga((n) => n + 1);
      onCobro?.();
      return true;
    } catch {
      setError("Error de conexión");
      return false;
    }
  }

  function abrirCobro(cita: Cita) {
    setError("");
    setCobrando(cita.id);
    setMonto(String(cita.montoCobrado ?? precioPela));
  }

  async function confirmarCobro(id: number) {
    const valor = Number(monto);
    if (!Number.isInteger(valor) || valor < 0) {
      setError("Escribe el monto en pesos enteros, sin centavos");
      return;
    }
    if (await enviar({ id, estado: "completada", montoCobrado: valor })) {
      setCobrando(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {ESTADOS.map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltro(estado)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              filtro === estado
                ? "bg-amber-500 text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"
            }`}
          >
            {estado}s
          </button>
        ))}
      </div>

      {esAdmin && (
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-1">Barbero</label>
          <select
            value={barberoId}
            onChange={(e) => onBarberoId(e.target.value)}
            className="w-full sm:w-auto rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos</option>
            {barberos.map((b) => (
              <option key={b.id} value={b.id}>{b.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : citas.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No hay citas {filtro}s
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <div
              key={cita.id}
              className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-lg truncate">
                    {cita.nombreCliente}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1 truncate">
                    {cita.telefono}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {cita.fecha}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm text-amber-400">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {cita.hora}
                    </span>
                  </div>
                  {esAdmin && (
                    <p className="text-zinc-400 text-xs mt-2">
                      Barbero: {cita.barberoNombre}
                    </p>
                  )}
                  {cita.montoCobrado !== null && cita.precioAplicado !== null && (
                    <p className="text-green-400 text-sm mt-2 font-medium">
                      Cobrado {formatearPesos(cita.montoCobrado)}
                      {repartir(cita.montoCobrado, cita.precioAplicado).propina > 0 && (
                        <span className="text-zinc-400 font-normal">
                          {" "}
                          ({formatearPesos(repartir(cita.montoCobrado, cita.precioAplicado).pela)}{" "}
                          + {formatearPesos(repartir(cita.montoCobrado, cita.precioAplicado).propina)} de propina)
                        </span>
                      )}
                    </p>
                  )}
                  {cita.estado === "completada" && cita.montoCobrado === null && (
                    <p className="text-yellow-400 text-xs mt-2">
                      Sin cobro registrado
                    </p>
                  )}
                  <p className="text-zinc-500 text-xs mt-1">
                    Agendada el {formatearCreadoEn(cita.creadoEn)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    cita.estado === "pendiente"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : cita.estado === "completada"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {cita.estado}
                </span>
              </div>

              {cobrando === cita.id ? (
                <div className="mt-4 pt-3 border-t border-zinc-700/50">
                  <label className="block text-sm text-zinc-300 mb-1">
                    ¿Cuánto te pagó?
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400 text-sm">RD$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      autoFocus
                      className="w-32 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-zinc-500 text-xs">
                      tu precio: {formatearPesos(precioPela)}
                    </span>
                  </div>
                  {Number(monto) > precioPela && (
                    <p className="text-green-400 text-xs mt-2">
                      {formatearPesos(precioPela)} de pela +{" "}
                      {formatearPesos(Number(monto) - precioPela)} de propina
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => confirmarCobro(cita.id)}
                      className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 transition-all"
                    >
                      Confirmar cobro
                    </button>
                    <button
                      onClick={() => setCobrando(null)}
                      className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2 border border-zinc-700 transition-all"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : cita.estado === "pendiente" ? (
                <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-700/50">
                  <button
                    onClick={() => abrirCobro(cita)}
                    className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 transition-all"
                  >
                    Completar y cobrar
                  </button>
                  <button
                    onClick={() => enviar({ id: cita.id, estado: "cancelada" })}
                    className="flex-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 border border-red-600/30 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              ) : cita.estado === "completada" ? (
                <div className="mt-4 pt-3 border-t border-zinc-700/50">
                  <button
                    onClick={() => abrirCobro(cita)}
                    className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 px-3 border border-zinc-700 transition-all"
                  >
                    {cita.montoCobrado === null ? "Registrar cobro" : "Corregir cobro"}
                  </button>
                </div>
              ) : null}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
