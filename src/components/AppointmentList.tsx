"use client";

import { useState, useEffect, useCallback } from "react";

interface Cita {
  id: number;
  nombreCliente: string;
  telefono: string;
  fecha: string;
  hora: string;
  estado: string;
  creadoEn: string;
}

export default function AppointmentList() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [loading, setLoading] = useState(true);

  const cargarCitas = useCallback(async () => {
    try {
      const res = await fetch(`/api/citas?estado=${filtro}`);
      const data = await res.json();
      setCitas(data);
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    setLoading(true);
    cargarCitas();
  }, [cargarCitas]);

  async function actualizarEstado(id: number, estado: string) {
    try {
      await fetch("/api/citas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, estado }),
      });
      cargarCitas();
    } catch {
      alert("Error al actualizar");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {["pendiente", "completada", "cancelada"].map((estado) => (
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

      {citas.length === 0 ? (
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

              {cita.estado === "pendiente" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-700/50">
                  <button
                    onClick={() => actualizarEstado(cita.id, "completada")}
                    className="flex-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 transition-all"
                  >
                    Completar
                  </button>
                  <button
                    onClick={() => actualizarEstado(cita.id, "cancelada")}
                    className="flex-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-2 border border-red-600/30 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
