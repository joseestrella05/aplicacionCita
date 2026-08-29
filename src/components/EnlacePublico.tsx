"use client";

import { useState } from "react";

export default function EnlacePublico({
  nombre,
  enlace,
}: {
  nombre: string;
  /** URL absoluta, armada en el servidor a partir de las cabeceras. */
  enlace: string;
}) {
  const [copiado, setCopiado] = useState(false);

  const mensaje = `Hola! Puedes agendar tu cita conmigo aquí: ${enlace}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-white">Tu link para clientes</h2>
      <p className="text-zinc-400 text-sm mt-1">
        Compártelo una vez y ya. No lleva el horario dentro: si lo cambias, el
        link muestra el horario nuevo al instante.
      </p>

      <div className="mt-4 rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3">
        <code className="text-amber-400 text-sm break-all">{enlace}</code>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        <button
          type="button"
          onClick={copiar}
          className="flex-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium py-2.5 px-4 border border-zinc-700 transition-all"
        >
          {copiado ? "Copiado" : "Copiar link"}
        </button>
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2.5 px-4 transition-all"
        >
          Compartir por WhatsApp
        </a>
      </div>

      <p className="text-zinc-600 text-xs mt-3">
        El mensaje va prellenado a nombre de {nombre}.
      </p>
    </div>
  );
}
