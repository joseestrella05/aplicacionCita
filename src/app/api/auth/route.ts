import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const dynamic = "force-dynamic";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "barberia123";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "mi-super-secreto-cambiar-en-produccion"
);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { password } = body;

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return NextResponse.json({ message: "Login exitoso" });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return NextResponse.json({ message: "Sesión cerrada" });
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({ authenticated: true, role: payload.role });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
