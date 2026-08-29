import { cookies } from "next/headers";
import { db } from "@/db";
import { barberos, type Barbero } from "@/db/schema";
import { eq } from "drizzle-orm";
import { COOKIE_SESION, verificarToken, type Sesion } from "./auth";

/**
 * El proxy ya rechaza las peticiones sin sesión, pero cada handler vuelve a
 * comprobarla: los docs de Next avisan de que un cambio de matcher puede
 * dejar una ruta fuera del proxy sin que nadie se entere.
 */
export async function sesionActual(): Promise<Sesion | null> {
  const cookieStore = await cookies();
  return verificarToken(cookieStore.get(COOKIE_SESION)?.value);
}

/** La sesión más el barbero que hay detrás, o null si ya no existe/está inactivo. */
export async function barberoEnSesion(): Promise<Barbero | null> {
  const sesion = await sesionActual();
  if (!sesion) return null;

  const [barbero] = await db
    .select()
    .from(barberos)
    .where(eq(barberos.id, sesion.barberoId));

  if (!barbero || !barbero.activo) return null;

  return barbero;
}

/** ¿Esta sesión puede tocar los recursos de `barberoId`? */
export function puedeVer(sesion: Sesion, barberoId: number): boolean {
  return sesion.rol === "admin" || sesion.barberoId === barberoId;
}
