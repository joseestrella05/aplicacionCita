import { NextResponse } from "next/server";
import { db } from "@/db";
import { barberos } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Público: lo consume el selector de la portada. Solo lo imprescindible. */
export async function GET() {
  const activos = await db
    .select({
      id: barberos.id,
      nombre: barberos.nombre,
      slug: barberos.slug,
    })
    .from(barberos)
    .where(eq(barberos.activo, true))
    .orderBy(asc(barberos.nombre));

  return NextResponse.json(activos);
}
