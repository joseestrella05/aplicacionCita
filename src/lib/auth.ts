import { SignJWT, jwtVerify } from "jose";

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

// Se evalúa al importar el módulo: si falta una variable, la app no arranca.
const JWT_SECRET = new TextEncoder().encode(leerVariable("JWT_SECRET"));

export interface SesionAdmin {
  role: "admin";
}

export async function firmarToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verificarToken(
  token: string | undefined
): Promise<SesionAdmin | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin") return null;
    return { role: "admin" };
  } catch {
    return null;
  }
}
