import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { barberos, citas } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ruta pública: devuelve solo las horas ocupadas de un barbero en una fecha,
 * sin datos de los clientes. `/api/citas` queda protegida por completo.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fecha = searchParams.get("fecha");
  const slug = searchParams.get("barbero");

  if (!fecha || !FORMATO_FECHA.test(fecha)) {
    return NextResponse.json(
      { error: "Fecha inválida. Usa el formato AAAA-MM-DD." },
      { status: 400 }
    );
  }

  if (!slug) {
    return NextResponse.json({ error: "Falta el barbero" }, { status: 400 });
  }

  const [barbero] = await db
    .select({ id: barberos.id })
    .from(barberos)
    .where(and(eq(barberos.slug, slug), eq(barberos.activo, true)));

  if (!barbero) {
    return NextResponse.json({ error: "Ese barbero no existe" }, { status: 404 });
  }

  const ocupadas = await db
    .select({ hora: citas.hora })
    .from(citas)
    .where(
      and(
        eq(citas.barberoId, barbero.id),
        eq(citas.fecha, fecha),
        ne(citas.estado, "cancelada")
      )
    );

  return NextResponse.json(ocupadas.map((c) => c.hora));
}
