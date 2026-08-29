import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { barberos, citas } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { sesionActual } from "@/lib/sesion";
import { generarHoras, esDiaLaboral, parsearDias } from "@/lib/horario";
import { fechaEnRD, minutosDelDiaEnRD } from "@/lib/fechas";
import { generarToken } from "@/lib/token";

export const dynamic = "force-dynamic";

const MAX_PENDIENTES_POR_TELEFONO = 2;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ESTADOS = ["pendiente", "completada", "cancelada"] as const;
type Estado = (typeof ESTADOS)[number];

/**
 * El índice único parcial `cita_unica` (barbero_id, fecha, hora) es lo que
 * decide si un cupo está libre. Cuando dos reservas simultáneas llegan al
 * mismo horario del mismo barbero, una gana el INSERT y la otra rebota aquí.
 */
function esCupoOcupado(error: unknown): boolean {
  let actual: unknown = error;

  while (actual instanceof Error) {
    const codigo = (actual as { code?: string }).code ?? "";
    if (
      actual.message.includes("UNIQUE constraint failed") ||
      codigo.startsWith("SQLITE_CONSTRAINT")
    ) {
      return true;
    }
    actual = actual.cause;
  }

  return false;
}

function minutosDe(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Un barbero solo ve sus citas. El admin las ve todas, o las de uno con
 * ?barberoId=. El filtro no es opcional: se aplica siempre en el WHERE.
 */
export async function GET(request: NextRequest) {
  const sesion = await sesionActual();

  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");
  const estado = searchParams.get("estado");
  const barberoIdPedido = searchParams.get("barberoId");

  const condiciones = [];

  if (sesion.rol === "admin") {
    if (barberoIdPedido) {
      condiciones.push(eq(citas.barberoId, Number(barberoIdPedido)));
    }
  } else {
    condiciones.push(eq(citas.barberoId, sesion.barberoId));
  }

  if (fecha && FORMATO_FECHA.test(fecha)) {
    condiciones.push(eq(citas.fecha, fecha));
  }

  if (estado && (ESTADOS as readonly string[]).includes(estado)) {
    condiciones.push(eq(citas.estado, estado as Estado));
  }

  const consulta = db
    .select({
      id: citas.id,
      barberoId: citas.barberoId,
      barberoNombre: barberos.nombre,
      nombreCliente: citas.nombreCliente,
      telefono: citas.telefono,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
      creadoEn: citas.creadoEn,
    })
    .from(citas)
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .orderBy(desc(citas.fecha), desc(citas.hora));

  const resultados =
    condiciones.length > 0
      ? await consulta.where(and(...condiciones))
      : await consulta;

  return NextResponse.json(resultados);
}

/** Pública: es como reservan los clientes. */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { barberoSlug, nombreCliente, telefono, fecha, hora } = body;

  if (!barberoSlug || !nombreCliente || !telefono || !fecha || !hora) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
  }

  if (!FORMATO_FECHA.test(fecha)) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }

  const [barbero] = await db
    .select()
    .from(barberos)
    .where(eq(barberos.slug, String(barberoSlug)));

  if (!barbero || !barbero.activo) {
    return NextResponse.json({ error: "Ese barbero no está disponible" }, { status: 404 });
  }

  const hoy = fechaEnRD();

  if (fecha < hoy) {
    return NextResponse.json({ error: "Esa fecha ya pasó" }, { status: 400 });
  }

  if (!esDiaLaboral(fecha, parsearDias(barbero.diasLaborales))) {
    return NextResponse.json(
      { error: `${barbero.nombre} no trabaja ese día` },
      { status: 400 }
    );
  }

  const horasDelDia = generarHoras(
    barbero.horaInicio,
    barbero.horaFin,
    barbero.duracionCita
  );

  if (!horasDelDia.includes(hora)) {
    return NextResponse.json(
      { error: "Esa hora no está dentro del horario del barbero" },
      { status: 400 }
    );
  }

  if (fecha === hoy && minutosDe(hora) <= minutosDelDiaEnRD()) {
    return NextResponse.json({ error: "Esa hora ya pasó" }, { status: 400 });
  }

  const pendientes = await db
    .select({ id: citas.id })
    .from(citas)
    .where(and(eq(citas.telefono, telefono), eq(citas.estado, "pendiente")));

  if (pendientes.length >= MAX_PENDIENTES_POR_TELEFONO) {
    return NextResponse.json(
      {
        error: `Ya tienes ${MAX_PENDIENTES_POR_TELEFONO} citas pendientes con este teléfono. Espera a que pasen o cancela una.`,
      },
      { status: 429 }
    );
  }

  // Sin SELECT previo: el cupo lo decide el índice único, no una lectura
  // que puede quedar obsoleta antes del INSERT.
  const token = generarToken();

  try {
    const result = await db.insert(citas).values({
      barberoId: barbero.id,
      nombreCliente,
      telefono,
      fecha,
      hora,
      token,
    });

    return NextResponse.json(
      {
        id: Number(result.lastInsertRowid),
        token,
        message: "Cita agendada",
      },
      { status: 201 }
    );
  } catch (error) {
    if (esCupoOcupado(error)) {
      return NextResponse.json(
        { error: "Ese cupo se acaba de ocupar. Elige otro." },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const sesion = await sesionActual();

  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { id, estado } = body;

  if (!id || !estado || !(ESTADOS as readonly string[]).includes(estado)) {
    return NextResponse.json({ error: "ID y estado son obligatorios" }, { status: 400 });
  }

  const [cita] = await db.select().from(citas).where(eq(citas.id, id));

  if (!cita) {
    return NextResponse.json({ error: "Esa cita no existe" }, { status: 404 });
  }

  // Un barbero no puede tocar las citas de otro.
  if (sesion.rol !== "admin" && cita.barberoId !== sesion.barberoId) {
    return NextResponse.json({ error: "Esa cita no es tuya" }, { status: 403 });
  }

  // Reactivar una cita cancelada puede chocar con otra que ya tomó el cupo.
  try {
    await db
      .update(citas)
      .set({ estado: estado as Estado })
      .where(eq(citas.id, id));
  } catch (error) {
    if (esCupoOcupado(error)) {
      return NextResponse.json(
        { error: "Ese cupo se acaba de ocupar. Elige otro." },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ message: "Cita actualizada" });
}
