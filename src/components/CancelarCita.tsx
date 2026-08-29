"use client";

import { useState } from "react";
import Link from "next/link";

export default function CancelarCita({
  token,
  estadoInicial,
}: {
  token: string;
  estadoInicial: string;
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function cancelar() {
    setError("");
    setEnviando(true);

    try {
      const res = await fetch(`/api/cita/${token}`, { method: "PATCH" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo cancelar");
        return;
      }

      setEstado("cancelada");
      setConfirmando(false);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (estado === "cancelada") {
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          Esta cita está cancelada. El cupo quedó libre para otra persona.
        </div>
        <Link
          href="/"
          className="block text-center rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 transition-all"
        >
          Agendar otra cita
        </Link>
      </div>
    );
  }

  if (estado === "completada") {
    return (
      <div className="mt-6 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-400 text-sm">
        Esta cita ya se completó. ¡Gracias por venir!
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {confirmando ? (
        <>
          <p className="text-zinc-400 text-sm text-center">
            ¿Seguro que quieres cancelar? El cupo quedará libre.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-3 border border-zinc-700 transition-all"
            >
              No, mantenerla
            </button>
            <button
              type="button"
              onClick={cancelar}
              disabled={enviando}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white text-sm font-medium py-3 transition-all"
            >
              {enviando ? "Cancelando..." : "Sí, cancelar"}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="w-full rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium py-3 border border-red-600/30 transition-all"
        >
          Cancelar mi cita
        </button>
      )}
    </div>
  );
}
