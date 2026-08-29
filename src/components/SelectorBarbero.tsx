"use client";

import { useState } from "react";
import Link from "next/link";

interface BarberoPublico {
  id: number;
  nombre: string;
  slug: string;
}

interface ProximoCupo {
  barbero: { nombre: string; slug: string };
  fecha: string;
  hora: string;
}

export default function SelectorBarbero({
  barberos,
}: {
  barberos: BarberoPublico[];
}) {
  const [cupo, setCupo] = useState<ProximoCupo | null>(null);
  const [error, setError] = useState("");
  const [buscando, setBuscando] = useState(false);

  async function buscarCualquiera() {
    setError("");
    setCupo(null);
    setBuscando(true);

    try {
      const res = await fetch("/api/proximo-cupo");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se encontró ningún cupo");
        return;
      }
      setCupo(data);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-3">
      {barberos.map((barbero) => (
        <Link
          key={barbero.id}
          href={`/b/${barbero.slug}`}
          className="flex items-center justify-between rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:border-amber-500/50 hover:bg-zinc-800 px-4 py-4 transition-all"
        >
          <span className="font-medium text-white">{barbero.nombre}</span>
          <svg className="w-5 h-5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ))}

      <div className="pt-3 border-t border-zinc-800">
        <button
          type="button"
          onClick={buscarCualquiera}
          disabled={buscando}
          className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-50 text-amber-400 font-medium py-4 transition-all"
        >
          {buscando ? "Buscando..." : "Cualquiera disponible"}
        </button>

        {cupo && (
          <Link
            href={`/b/${cupo.barbero.slug}`}
            className="block mt-3 rounded-xl bg-zinc-800 border border-amber-500/40 px-4 py-4 hover:bg-zinc-750 transition-all"
          >
            <p className="text-zinc-400 text-xs">Cupo más cercano</p>
            <p className="text-white font-semibold mt-1">
              {cupo.barbero.nombre} — {cupo.fecha} a las {cupo.hora}
            </p>
            <p className="text-amber-400 text-sm mt-2">Reservar con {cupo.barbero.nombre} →</p>
          </Link>
        )}

        {error && (
          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
