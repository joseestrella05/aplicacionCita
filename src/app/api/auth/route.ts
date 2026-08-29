import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COOKIE_SESION,
  DURACION_SESION_SEGUNDOS,
  firmarToken,
  verificarToken,
} from "@/lib/auth";
import { verificarPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

if (!ADMIN_PASSWORD_HASH) {
  throw new Error(
    "Falta la variable de entorno ADMIN_PASSWORD_HASH. Genérala con: node scripts/hash-password.mjs \"tu-contraseña\""
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const valida = await verificarPassword(password, ADMIN_PASSWORD_HASH!);

  if (!valida) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await firmarToken();

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
  const cookieStore = await cookies();
  const sesion = await verificarToken(cookieStore.get(COOKIE_SESION)?.value);

  if (!sesion) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, role: sesion.role });
}
