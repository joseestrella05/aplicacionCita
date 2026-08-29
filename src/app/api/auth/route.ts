import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { barberos } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
  firmarToken,
} from "@/lib/auth";
import { verificarPassword } from "@/lib/password";
import { barberoEnSesion } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * Contraseña de arranque. Sirve solo para el admin que salió de la
 * migración con `password_hash` vacío: le permite entrar y ponerse una
 * contraseña propia desde el panel. En cuanto la ponga, deja de usarse.
 */
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_PASSWORD_HASH) {
  throw new Error(
    'Falta la variable de entorno ADMIN_PASSWORD_HASH. Genérala con: node scripts/hash-password.mjs "tu-contraseña"'
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, password } = body;

  if (typeof slug !== "string" || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const [barbero] = await db
    .select()
    .from(barberos)
    .where(eq(barberos.slug, slug));

  if (!barbero || !barbero.activo) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const valida = barbero.passwordHash
    ? await verificarPassword(password, barbero.passwordHash)
    : barbero.rol === "admin" &&
      (await verificarPassword(password, ADMIN_PASSWORD_HASH!));

  if (!valida) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await firmarToken({ barberoId: barbero.id, rol: barbero.rol });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DURACION_SESION_SEGUNDOS,
    path: "/",
  });

  return NextResponse.json({ message: "Login exitoso" });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESION);
  return NextResponse.json({ message: "Sesión cerrada" });
}

export async function GET() {
  const barbero = await barberoEnSesion();

  if (!barbero) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    barberoId: barbero.id,
    nombre: barbero.nombre,
    slug: barbero.slug,
    rol: barbero.rol,
    debeCambiarPassword: barbero.passwordHash === "",
  });
}
