import { NextResponse } from "next/server";
import { db } from "@/db";
import { citas } from "@/db/schema";
import { and, eq, gte, lte, isNotNull, isNull } from "drizzle-orm";
import { sesionActual } from "@/lib/sesion";
import { repartir } from "@/lib/dinero";
import {
  rangoDia,
  rangoSemana,
  rangoMes,
  rangoUltimosDias,
  type Rango,
} from "@/lib/periodos";
import { fechaEnRD } from "@/lib/fechas";

export const dynamic = "force-dynamic";

const DIAS_DESGLOSE = 14;

interface Resumen {
  desde: string;
  hasta: string;
  citas: number;
  total: number;
  pelas: number;
  propinas: number;
}

type Cobro = { fecha: string; montoCobrado: number; precioAplicado: number };

function resumir(cobros: Cobro[], rango: Rango): Resumen {
  const dentro = cobros.filter(
    (c) => c.fecha >= rango.desde && c.fecha <= rango.hasta
  );

  let pelas = 0;
  let propinas = 0;

  for (const c of dentro) {
    const reparto = repartir(c.montoCobrado, c.precioAplicado);
    pelas += reparto.pela;
    propinas += reparto.propina;
  }

  return {
    desde: rango.desde,
    hasta: rango.hasta,
    citas: dentro.length,
    total: pelas + propinas,
    pelas,
    propinas,
  };
}

/**
 * Cuánto ganó hoy, esta semana y este mes el barbero que está en sesión.
 *
 * Lo que factura cada quien es suyo y de nadie más: ser admin no da acceso al
 * dinero ajeno. El filtro por barbero_id va siempre en el WHERE, no hay
 * parámetro que lo cambie.
 */
export async function GET() {
  const sesion = await sesionActual();

  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const condiciones = [
    eq(citas.barberoId, sesion.barberoId),
    eq(citas.estado, "completada"),
    isNotNull(citas.montoCobrado),
  ];

  const hoy = fechaEnRD();
  const mes = rangoMes(hoy);
  const desglose = rangoUltimosDias(DIAS_DESGLOSE, hoy);

  // Basta con traer desde lo más antiguo que se vaya a mostrar.
  const desdeMinimo = desglose.desde < mes.desde ? desglose.desde : mes.desde;

  const filas = await db
    .select({
      fecha: citas.fecha,
      montoCobrado: citas.montoCobrado,
      precioAplicado: citas.precioAplicado,
    })
    .from(citas)
    .where(and(...condiciones, gte(citas.fecha, desdeMinimo), lte(citas.fecha, mes.hasta)));

  const cobros: Cobro[] = filas.map((f) => ({
    fecha: f.fecha,
    montoCobrado: f.montoCobrado ?? 0,
    precioAplicado: f.precioAplicado ?? 0,
  }));

  // Citas dadas por completadas a las que nadie les puso el monto: se avisan
  // aparte para que un total bajo no parezca un mal día.
  const sinCobrar = await db
    .select({ id: citas.id })
    .from(citas)
    .where(
      and(
        eq(citas.barberoId, sesion.barberoId),
        eq(citas.estado, "completada"),
        isNull(citas.montoCobrado)
      )
    );

  const porDia = [];
  for (let i = 0; i < DIAS_DESGLOSE; i++) {
    const d = new Date(`${desglose.hasta}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i);
    const fecha = d.toISOString().slice(0, 10);
    const resumen = resumir(cobros, { desde: fecha, hasta: fecha });
    porDia.push({
      fecha,
      citas: resumen.citas,
      total: resumen.total,
      propinas: resumen.propinas,
    });
  }

  return NextResponse.json({
    hoy: resumir(cobros, rangoDia(hoy)),
    semana: resumir(cobros, rangoSemana(hoy)),
    mes: resumir(cobros, mes),
    porDia,
    completadasSinCobro: sinCobrar.length,
  });
}
