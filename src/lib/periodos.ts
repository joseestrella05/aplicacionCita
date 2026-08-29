import { fechaEnRD } from "./fechas";

/**
 * Rangos de fechas para los informes, siempre en calendario de RD.
 * `citas.fecha` es un texto "AAAA-MM-DD", así que comparar por string
 * funciona igual que comparar por fecha.
 */
export interface Rango {
  desde: string;
  hasta: string;
}

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function diaDeLaSemana(fecha: string): number {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

export function rangoDia(hoy = fechaEnRD()): Rango {
  return { desde: hoy, hasta: hoy };
}

/** Semana de lunes a domingo, que es como se cuenta aquí. */
export function rangoSemana(hoy = fechaEnRD()): Rango {
  const desplazamiento = (diaDeLaSemana(hoy) + 6) % 7;
  const lunes = sumarDias(hoy, -desplazamiento);
  return { desde: lunes, hasta: sumarDias(lunes, 6) };
}

export function rangoMes(hoy = fechaEnRD()): Rango {
  const [anio, mes] = hoy.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return {
    desde: `${hoy.slice(0, 7)}-01`,
    hasta: `${hoy.slice(0, 7)}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

/** Los últimos N días incluyendo hoy, para el desglose diario. */
export function rangoUltimosDias(dias: number, hoy = fechaEnRD()): Rango {
  return { desde: sumarDias(hoy, -(dias - 1)), hasta: hoy };
}
