export interface Horario {
  horaInicio: string;
  horaFin: string;
  duracionCita: number;
  /** 0=domingo … 6=sábado */
  diasLaborales: number[];
}

export const NOMBRES_DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Cupos de un día. El cupo tiene que caber entero antes de cerrar: por eso
 * la condición es `+ duracion <=` y no solo `<=`.
 */
export function generarHoras(
  inicio: string,
  fin: string,
  duracion: number
): string[] {
  const horas: string[] = [];
  const [hInicio, mInicio] = inicio.split(":").map(Number);
  const [hFin, mFin] = fin.split(":").map(Number);

  if ([hInicio, mInicio, hFin, mFin].some(Number.isNaN) || duracion <= 0) {
    return horas;
  }

  let minutosActuales = hInicio * 60 + mInicio;
  const minutosFin = hFin * 60 + mFin;

  while (minutosActuales + duracion <= minutosFin) {
    const h = Math.floor(minutosActuales / 60);
    const m = minutosActuales % 60;
    horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    minutosActuales += duracion;
  }

  return horas;
}

/** "1,2,3,4,5,6" -> [1,2,3,4,5,6] */
export function parsearDias(csv: string): number[] {
  return csv
    .split(",")
    .map((d) => Number(d.trim()))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
}

/**
 * Día de la semana de una fecha "AAAA-MM-DD". Se lee como fecha de
 * calendario, no como instante: getUTCDay sobre la medianoche UTC da el día
 * correcto sin que influya la zona de quien ejecuta.
 */
export function diaDeLaSemana(fecha: string): number {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

export function esDiaLaboral(fecha: string, dias: number[]): boolean {
  return dias.includes(diaDeLaSemana(fecha));
}
