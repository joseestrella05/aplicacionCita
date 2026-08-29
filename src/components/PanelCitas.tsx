"use client";

import { useState } from "react";
import ResumenIngresos from "./ResumenIngresos";
import AppointmentList from "./AppointmentList";

interface BarberoOpcion {
  id: number;
  nombre: string;
}

/**
 * Junta los ingresos con la lista de citas: cuando se registra un cobro hay
 * que refrescar los totales, y cuando el admin filtra por barbero, ambos
 * tienen que mirar al mismo.
 */
export default function PanelCitas({
  esAdmin,
  barberos,
  precioPela,
}: {
  esAdmin: boolean;
  barberos: BarberoOpcion[];
  precioPela: number;
}) {
  const [recargar, setRecargar] = useState(0);
  const [barberoId, setBarberoId] = useState("");

  return (
    <>
      <ResumenIngresos
        barberoId={esAdmin && barberoId ? barberoId : undefined}
        recargar={recargar}
      />

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
        <AppointmentList
          esAdmin={esAdmin}
          barberos={barberos}
          precioPela={precioPela}
          barberoId={barberoId}
          onBarberoId={setBarberoId}
          onCobro={() => setRecargar((n) => n + 1)}
        />
      </div>
    </>
  );
}
