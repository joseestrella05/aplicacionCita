import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { barberos, citas } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Pública, pero solo con el token: es el enlace que recibe el cliente al
 * reservar. No se puede listar ni adivinar.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [cita] = await db
    .select({
      nombreCliente: citas.nombreCliente,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
      barberoNombre: barberos.nombre,
      barberoSlug: barberos.slug,
    })
    .from(citas)
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .where(eq(citas.token, token));

  if (!cita) {
    return NextResponse.json({ error: "Esa cita no existe" }, { status: 404 });
  }

  return NextResponse.json(cita);
}

/** El cliente solo puede cancelar. Nada más. */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const [cita] = await db.select().from(citas).where(eq(citas.token, token));

  if (!cita) {
    return NextResponse.json({ error: "Esa cita no existe" }, { status: 404 });
  }

  if (cita.estado === "cancelada") {
    return NextResponse.json({ message: "Esa cita ya estaba cancelada" });
  }

  if (cita.estado === "completada") {
    return NextResponse.json(
      { error: "Esa cita ya se completó, no se puede cancelar" },
      { status: 400 }
    );
  }

  await db.update(citas).set({ estado: "cancelada" }).where(eq(citas.id, cita.id));

  return NextResponse.json({ message: "Cita cancelada" });
}
