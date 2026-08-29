import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { barberos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { barberoEnSesion } from "@/lib/sesion";
import { hashearPassword } from "@/lib/password";
import { generarHoras, parsearDias } from "@/lib/horario";
import { montoValido, MONTO_MAXIMO } from "@/lib/dinero";

export const dynamic = "force-dynamic";

const FORMATO_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** El barbero en sesión: sus datos y su horario. Nunca el hash. */
export async function GET() {
  const barbero = await barberoEnSesion();

  if (!barbero) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    id: barbero.id,
    nombre: barbero.nombre,
    slug: barbero.slug,
    rol: barbero.rol,
    horaInicio: barbero.horaInicio,
    horaFin: barbero.horaFin,
    duracionCita: barbero.duracionCita,
    precioPela: barbero.precioPela,
    diasLaborales: parsearDias(barbero.diasLaborales),
    tienePassword: barbero.passwordHash !== "",
  });
}

/** Cada barbero edita su propio horario y su propia contraseña. */
export async function PUT(request: NextRequest) {
  const barbero = await barberoEnSesion();

  if (!barbero) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { horaInicio, horaFin, duracionCita, diasLaborales, precioPela, password } = body;

  const cambios: Record<string, unknown> = {};

  if (horaInicio !== undefined || horaFin !== undefined || duracionCita !== undefined) {
    const inicio = horaInicio ?? barbero.horaInicio;
    const fin = horaFin ?? barbero.horaFin;
    const duracion = Number(duracionCita ?? barbero.duracionCita);

    if (!FORMATO_HORA.test(inicio) || !FORMATO_HORA.test(fin)) {
      return NextResponse.json({ error: "Las horas deben tener el formato HH:MM" }, { status: 400 });
    }
    if (!Number.isInteger(duracion) || duracion < 5 || duracion > 480) {
      return NextResponse.json({ error: "La duración debe estar entre 5 y 480 minutos" }, { status: 400 });
    }
    if (generarHoras(inicio, fin, duracion).length === 0) {
      return NextResponse.json(
        { error: "Con ese horario no cabe ninguna cita. Revisa la hora de cierre o la duración." },
        { status: 400 }
      );
    }

    cambios.horaInicio = inicio;
    cambios.horaFin = fin;
    cambios.duracionCita = duracion;
  }

  if (diasLaborales !== undefined) {
    const dias = Array.isArray(diasLaborales)
      ? diasLaborales.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : [];

    if (dias.length === 0) {
      return NextResponse.json({ error: "Elige al menos un día de trabajo" }, { status: 400 });
    }

    cambios.diasLaborales = [...new Set(dias)].sort().join(",");
  }

  if (precioPela !== undefined) {
    if (!montoValido(precioPela)) {
      return NextResponse.json(
        { error: `El precio debe ser un número entero de pesos entre 0 y ${MONTO_MAXIMO}` },
        { status: 400 }
      );
    }
    cambios.precioPela = precioPela;
  }

  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }
    cambios.passwordHash = await hashearPassword(password);
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay nada que actualizar" }, { status: 400 });
  }

  await db.update(barberos).set(cambios).where(eq(barberos.id, barbero.id));

  return NextResponse.json({ message: "Guardado" });
}
