/**
 * Toda la app razona en la hora de República Dominicana, no en la del
 * navegador ni en la del servidor. La base guarda `creado_en` en UTC
 * (datetime('now')) y aquí se convierte al mostrar.
 */
export const ZONA = "America/Santo_Domingo";

const FORMATO_FECHA = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const FORMATO_HORA = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONA,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

const FORMATO_LEGIBLE = new Intl.DateTimeFormat("es-DO", {
  timeZone: ZONA,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

function parte(
  formato: Intl.DateTimeFormat,
  momento: Date,
  tipo: Intl.DateTimeFormatPartTypes
): string {
  return formato.formatToParts(momento).find((p) => p.type === tipo)?.value ?? "";
}

/** Fecha de hoy en RD, como "AAAA-MM-DD". */
export function fechaEnRD(momento: Date = new Date()): string {
  const anio = parte(FORMATO_FECHA, momento, "year");
  const mes = parte(FORMATO_FECHA, momento, "month");
  const dia = parte(FORMATO_FECHA, momento, "day");
  return `${anio}-${mes}-${dia}`;
}

/** Minutos transcurridos desde medianoche en RD. */
export function minutosDelDiaEnRD(momento: Date = new Date()): number {
  const horas = Number(parte(FORMATO_HORA, momento, "hour"));
  const minutos = Number(parte(FORMATO_HORA, momento, "minute"));
  return horas * 60 + minutos;
}

/**
 * SQLite guarda datetime('now') como "AAAA-MM-DD HH:MM:SS" en UTC, sin
 * marca de zona. Hay que decirle a Date que es UTC antes de convertir.
 */
export function desdeUtcSqlite(valor: string): Date {
  return new Date(`${valor.replace(" ", "T")}Z`);
}

/** "2026-08-28 18:56:55" (UTC) -> "28/08/2026, 14:56" (RD). */
export function formatearCreadoEn(valor: string): string {
  const momento = desdeUtcSqlite(valor);
  if (Number.isNaN(momento.getTime())) return valor;
  return FORMATO_LEGIBLE.format(momento);
}
