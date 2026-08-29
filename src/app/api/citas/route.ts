import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citas } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const MAX_PENDIENTES_POR_TELEFONO = 2;

/**
 * El índice único parcial `cita_unica` es lo que decide si un cupo está
 * libre. Cuando dos reservas simultáneas llegan al mismo horario, una gana
 * el INSERT y la otra rebota aquí.
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");
  const estado = searchParams.get("estado");

  if (fecha && estado) {
    const results = await db
      .select()
      .from(citas)
      .where(and(eq(citas.fecha, fecha), eq(citas.estado, estado as "pendiente" | "completada" | "cancelada")));
    return NextResponse.json(results);
  }

  if (estado) {
    const results = await db
      .select()
      .from(citas)
      .where(eq(citas.estado, estado as "pendiente" | "completada" | "cancelada"));
    return NextResponse.json(results);
  }

  if (fecha) {
    const results = await db.select().from(citas).where(eq(citas.fecha, fecha));
    return NextResponse.json(results);
  }

  const results = await db.select().from(citas).orderBy(desc(citas.creadoEn));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nombreCliente, telefono, fecha, hora } = body;

  if (!nombreCliente || !telefono || !fecha || !hora) {
    return NextResponse.json(
      { error: "Todos los campos son obligatorios" },
      { status: 400 }
    );
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
  try {
    const result = await db.insert(citas).values({
      nombreCliente,
      telefono,
      fecha,
      hora,
    });

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), message: "Cita agendada" },
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
  const body = await request.json();
  const { id, estado } = body;

  if (!id || !estado) {
    return NextResponse.json({ error: "ID y estado son obligatorios" }, { status: 400 });
  }

  // Reactivar una cita cancelada puede chocar con otra que ya tomó el cupo.
  try {
    await db.update(citas).set({ estado }).where(eq(citas.id, id));
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
