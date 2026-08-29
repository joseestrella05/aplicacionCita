import { SignJWT, jwtVerify } from "jose";
import type { Rol } from "@/db/schema";

export const COOKIE_SESION = "admin_token";
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 24 * 7;

function leerVariable(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Copia .env.example a .env.local y complétala antes de arrancar la app.`
    );
  }
  return valor;
}

// Se evalúa al importar el módulo: si falta la variable, la app no arranca.
const JWT_SECRET = new TextEncoder().encode(leerVariable("JWT_SECRET"));

export interface Sesion {
  barberoId: number;
  rol: Rol;
}

export async function firmarToken(sesion: Sesion): Promise<string> {
  return new SignJWT({ barberoId: sesion.barberoId, rol: sesion.rol })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verificarToken(
  token: string | undefined
): Promise<Sesion | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const barberoId = payload.barberoId;
    const rol = payload.rol;

    if (typeof barberoId !== "number") return null;
    if (rol !== "barbero" && rol !== "admin") return null;

    return { barberoId, rol };
  } catch {
    return null;
  }
}
