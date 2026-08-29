import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { citas } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ruta pública: devuelve solo las horas ocupadas de una fecha, sin datos
 * de los clientes. `/api/citas` queda protegida por completo.
 */
export async function GET(request: NextRequest) {
  const fecha = request.nextUrl.searchParams.get("fecha");

  if (!fecha || !FORMATO_FECHA.test(fecha)) {
    return NextResponse.json(
      { error: "Fecha inválida. Usa el formato AAAA-MM-DD." },
      { status: 400 }
    );
  }

  const ocupadas = await db
    .select({ hora: citas.hora })
    .from(citas)
    .where(and(eq(citas.fecha, fecha), ne(citas.estado, "cancelada")));

  return NextResponse.json(ocupadas.map((c) => c.hora));
}
