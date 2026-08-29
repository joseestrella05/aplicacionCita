/**
 * Los montos se guardan en pesos enteros. Nada de centavos ni de decimales
 * flotantes: una pela se cobra en pesos redondos.
 */
const FORMATO = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});

export function formatearPesos(monto: number): string {
  return FORMATO.format(monto);
}

/**
 * Reparte lo que pagó el cliente entre pela y propina.
 *
 * Si pagó menos que el precio (un descuento, un vuelto que faltó) no hay
 * propina negativa: la propina es cero y la pela es lo que entró.
 */
export function repartir(
  montoCobrado: number,
  precioAplicado: number
): { pela: number; propina: number } {
  const propina = Math.max(0, montoCobrado - precioAplicado);
  return { pela: montoCobrado - propina, propina };
}

export const MONTO_MAXIMO = 100_000;

export function montoValido(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isInteger(valor) &&
    valor >= 0 &&
    valor <= MONTO_MAXIMO
  );
}
