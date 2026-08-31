"use client";

import { useState } from "react";
import ResumenIngresos from "./ResumenIngresos";
import AppointmentList from "./AppointmentList";

/**
 * Junta los ingresos con la lista de citas para que registrar un cobro
 * refresque los totales. Ambos muestran solo lo del barbero en sesión.
 */
export default function PanelCitas({ precioPela }: { precioPela: number }) {
  const [recargar, setRecargar] = useState(0);

  return (
    <>
      <ResumenIngresos recargar={recargar} />

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
        <AppointmentList
          precioPela={precioPela}
          onCobro={() => setRecargar((n) => n + 1)}
        />
      </div>
    </>
  );
}
