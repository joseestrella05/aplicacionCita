import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citas } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fecha = searchParams.get("fecha");
  const estado = searchParams.get("estado");

  let query = db.select().from(citas);

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

  const existente = await db
    .select()
    .from(citas)
    .where(and(eq(citas.fecha, fecha), eq(citas.hora, hora), eq(citas.estado, "pendiente")));

  if (existente.length > 0) {
    return NextResponse.json(
      { error: "Ese horario ya está ocupado" },
      { status: 409 }
    );
  }

  const result = await db.insert(citas).values({
    nombreCliente,
    telefono,
    fecha,
    hora,
  });

  return NextResponse.json({ id: Number(result.lastInsertRowid), message: "Cita agendada" }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, estado } = body;

  if (!id || !estado) {
    return NextResponse.json({ error: "ID y estado son obligatorios" }, { status: 400 });
  }

  await db.update(citas).set({ estado }).where(eq(citas.id, id));

  return NextResponse.json({ message: "Cita actualizada" });
}
