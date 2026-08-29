import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { barberos } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { sesionActual } from "@/lib/sesion";
import { hashearPassword } from "@/lib/password";
import { generarSlug, slugValido } from "@/lib/slug";
import { parsearDias } from "@/lib/horario";

export const dynamic = "force-dynamic";

async function exigirAdmin() {
  const sesion = await sesionActual();
  if (!sesion || sesion.rol !== "admin") return null;
  return sesion;
}

function esSlugRepetido(error: unknown): boolean {
  let actual: unknown = error;
  while (actual instanceof Error) {
    if (actual.message.includes("UNIQUE constraint failed")) return true;
    actual = actual.cause;
  }
  return false;
}

/** Todos los barberos, activos o no. Nunca se devuelve el hash. */
export async function GET() {
  if (!(await exigirAdmin())) {
    return NextResponse.json({ error: "Solo para el administrador" }, { status: 403 });
  }

  const filas = await db.select().from(barberos).orderBy(asc(barberos.nombre));

  return NextResponse.json(
    filas.map((b) => ({
      id: b.id,
      nombre: b.nombre,
      slug: b.slug,
      rol: b.rol,
      activo: b.activo,
      horaInicio: b.horaInicio,
      horaFin: b.horaFin,
      duracionCita: b.duracionCita,
      diasLaborales: parsearDias(b.diasLaborales),
      tienePassword: b.passwordHash !== "",
    }))
  );
}

export async function POST(request: NextRequest) {
  if (!(await exigirAdmin())) {
    return NextResponse.json({ error: "Solo para el administrador" }, { status: 403 });
  }

  const body = await request.json();
  const { nombre, password, rol } = body;
  const slug = body.slug ? String(body.slug) : generarSlug(String(nombre ?? ""));

  if (typeof nombre !== "string" || nombre.trim().length < 2) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }
  if (!slugValido(slug)) {
    return NextResponse.json(
      { error: "El link solo puede llevar letras, números y guiones (ej: jose-ramirez)" },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }
  if (rol !== undefined && rol !== "barbero" && rol !== "admin") {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  try {
    const result = await db.insert(barberos).values({
      nombre: nombre.trim(),
      slug,
      passwordHash: await hashearPassword(password),
      rol: rol ?? "barbero",
    });

    return NextResponse.json(
      { id: Number(result.lastInsertRowid), slug, message: "Barbero creado" },
      { status: 201 }
    );
  } catch (error) {
    if (esSlugRepetido(error)) {
      return NextResponse.json(
        { error: `Ya hay un barbero con el link "${slug}". Elige otro.` },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function PATCH(request: NextRequest) {
  const sesion = await exigirAdmin();
  if (!sesion) {
    return NextResponse.json({ error: "Solo para el administrador" }, { status: 403 });
  }

  const body = await request.json();
  const { id, nombre, slug, activo, rol, password } = body;

  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const [objetivo] = await db.select().from(barberos).where(eq(barberos.id, id));

  if (!objetivo) {
    return NextResponse.json({ error: "Ese barbero no existe" }, { status: 404 });
  }

  const cambios: Record<string, unknown> = {};

  if (nombre !== undefined) {
    if (typeof nombre !== "string" || nombre.trim().length < 2) {
      return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
    }
    cambios.nombre = nombre.trim();
  }

  if (slug !== undefined) {
    if (!slugValido(String(slug))) {
      return NextResponse.json(
        { error: "El link solo puede llevar letras, números y guiones" },
        { status: 400 }
      );
    }
    cambios.slug = String(slug);
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

  if (rol !== undefined) {
    if (rol !== "barbero" && rol !== "admin") {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    if (objetivo.id === sesion.barberoId && rol !== "admin") {
      return NextResponse.json(
        { error: "No puedes quitarte a ti mismo el rol de administrador" },
        { status: 400 }
      );
    }
    cambios.rol = rol;
  }

  if (activo !== undefined) {
    if (objetivo.id === sesion.barberoId && activo === false) {
      return NextResponse.json({ error: "No puedes desactivarte a ti mismo" }, { status: 400 });
    }
    cambios.activo = Boolean(activo);
  }

  if (Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "No hay nada que actualizar" }, { status: 400 });
  }

  try {
    await db.update(barberos).set(cambios).where(eq(barberos.id, id));
  } catch (error) {
    if (esSlugRepetido(error)) {
      return NextResponse.json(
        { error: "Ya hay un barbero con ese link. Elige otro." },
        { status: 409 }
      );
    }
    throw error;
  }

  return NextResponse.json({ message: "Barbero actualizado" });
}
