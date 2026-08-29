import { randomBytes } from "node:crypto";

/** Token público de una cita: va en la URL /cita/<token>. */
export function generarToken(): string {
  return randomBytes(16).toString("hex");
}
