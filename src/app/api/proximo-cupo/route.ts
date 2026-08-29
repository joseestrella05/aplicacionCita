import { NextResponse } from "next/server";
import { db } from "@/db";
import { barberos, citas } from "@/db/schema";
import { and, eq, gte, ne } from "drizzle-orm";
import { generarHoras, parsearDias, esDiaLaboral } from "@/lib/horario";
import { fechaEnRD, minutosDelDiaEnRD } from "@/lib/fechas";

export const dynamic = "force-dynamic";

/** Hasta dónde se busca hacia adelante antes de rendirse. */
const DIAS_A_MIRAR = 30;

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function minutosDe(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/**
 * "Cualquiera disponible": el cupo libre más cercano entre todos los
 * barberos activos. Público.
 */
export async function GET() {
  const activos = await db
    .select()
    .from(barberos)
    .where(eq(barberos.activo, true));

  if (activos.length === 0) {
    return NextResponse.json({ error: "No hay barberos disponibles" }, { status: 404 });
  }

  const hoy = fechaEnRD();
  const minutosAhora = minutosDelDiaEnRD();

  // Una sola consulta para todo el rango, en vez de una por día y barbero.
  const ocupadas = await db
    .select({ barberoId: citas.barberoId, fecha: citas.fecha, hora: citas.hora })
    .from(citas)
    .where(and(gte(citas.fecha, hoy), ne(citas.estado, "cancelada")));

  const tomadas = new Set(
    ocupadas.map((c) => `${c.barberoId}|${c.fecha}|${c.hora}`)
  );

  for (let i = 0; i < DIAS_A_MIRAR; i++) {
    const fecha = sumarDias(hoy, i);
    let mejor: { barbero: (typeof activos)[number]; hora: string } | null = null;

    for (const barbero of activos) {
      if (!esDiaLaboral(fecha, parsearDias(barbero.diasLaborales))) continue;

      for (const hora of generarHoras(
        barbero.horaInicio,
        barbero.horaFin,
        barbero.duracionCita
      )) {
        if (fecha === hoy && minutosDe(hora) <= minutosAhora) continue;
        if (tomadas.has(`${barbero.id}|${fecha}|${hora}`)) continue;

        if (!mejor || minutosDe(hora) < minutosDe(mejor.hora)) {
          mejor = { barbero, hora };
        }
        break; // dentro de un barbero, la primera libre ya es la más temprana
      }
    }

    if (mejor) {
      return NextResponse.json({
        barbero: { nombre: mejor.barbero.nombre, slug: mejor.barbero.slug },
        fecha,
        hora: mejor.hora,
      });
    }
  }

  return NextResponse.json(
    { error: `No hay cupos libres en los próximos ${DIAS_A_MIRAR} días` },
    { status: 404 }
  );
}
