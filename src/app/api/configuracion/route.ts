import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { configuracion } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await db.select().from(configuracion);
  const config: Record<string, string> = {};
  results.forEach((row) => {
    config[row.clave] = row.valor;
  });
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { clave, valor } = body;

  if (!clave || valor === undefined) {
    return NextResponse.json({ error: "Clave y valor son obligatorios" }, { status: 400 });
  }

  const existing = await db.select().from(configuracion).where(eq(configuracion.clave, clave));

  if (existing.length > 0) {
    await db.update(configuracion).set({ valor }).where(eq(configuracion.clave, clave));
  } else {
    await db.insert(configuracion).values({ clave, valor });
  }

  return NextResponse.json({ message: "Configuración actualizada" });
}
