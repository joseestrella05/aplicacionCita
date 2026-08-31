"use client";

import { useState, useEffect } from "react";
import { formatearPesos } from "@/lib/dinero";

interface Periodo {
  desde: string;
  hasta: string;
  citas: number;
  total: number;
  pelas: number;
  propinas: number;
}

interface DiaSuelto {
  fecha: string;
  citas: number;
  total: number;
  propinas: number;
}

interface Ingresos {
  hoy: Periodo;
  semana: Periodo;
  mes: Periodo;
  porDia: DiaSuelto[];
  completadasSinCobro: number;
}

function Tarjeta({ titulo, periodo }: { titulo: string; periodo: Periodo }) {
  return (
    <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4">
      <p className="text-zinc-400 text-xs">{titulo}</p>
      <p className="text-2xl font-bold text-white mt-1">
        {formatearPesos(periodo.total)}
      </p>
      <p className="text-zinc-500 text-xs mt-2">
        {periodo.citas} {periodo.citas === 1 ? "pela" : "pelas"}
      </p>
      {periodo.propinas > 0 && (
        <p className="text-green-400 text-xs mt-1">
          {formatearPesos(periodo.propinas)} de propina
        </p>
      )}
    </div>
  );
}

// Siempre son los ingresos del barbero en sesión: la API no acepta otro.
export default function ResumenIngresos({
  recargar,
}: {
  /** Cambia cuando se registra un cobro, para volver a pedir los totales. */
  recargar: number;
}) {
  const [datos, setDatos] = useState<Ingresos | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const res = await fetch("/api/ingresos");
        const data = await res.json();
        if (!vigente) return;
        if (!res.ok) {
          setError(data.error || "No se pudieron cargar los ingresos");
          return;
        }
        setError("");
        setDatos(data);
      } catch {
        if (vigente) setError("Error de conexión");
      }
    })();

    return () => {
      vigente = false;
    };
  }, [recargar]);

  if (error) {
    return (
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mb-6">
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mb-6 flex justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
      </div>
    );
  }

  const diasConAlgo = datos.porDia.filter((d) => d.citas > 0);

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">Lo que has ganado</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tarjeta titulo="Hoy" periodo={datos.hoy} />
        <Tarjeta titulo="Esta semana (lun a dom)" periodo={datos.semana} />
        <Tarjeta titulo="Este mes" periodo={datos.mes} />
      </div>

      {datos.completadasSinCobro > 0 && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-2 text-yellow-400 text-sm mt-4">
          Hay {datos.completadasSinCobro}{" "}
          {datos.completadasSinCobro === 1 ? "cita completada" : "citas completadas"} sin
          cobro registrado, así que no cuentan en estos totales. Puedes ponerles
          el monto desde la pestaña Completadas.
        </div>
      )}

      <div className="mt-5">
        <h3 className="text-sm text-zinc-400 mb-2">Últimos 14 días</h3>
        {diasConAlgo.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            Todavía no has registrado ningún cobro.
          </p>
        ) : (
          <div className="space-y-1">
            {diasConAlgo.map((dia) => (
              <div
                key={dia.fecha}
                className="flex items-center justify-between text-sm py-1.5 border-b border-zinc-800 last:border-0"
              >
                <span className="text-zinc-400">{dia.fecha}</span>
                <span className="text-zinc-500 text-xs">
                  {dia.citas} {dia.citas === 1 ? "pela" : "pelas"}
                </span>
                <span className="text-white font-medium">
                  {formatearPesos(dia.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
