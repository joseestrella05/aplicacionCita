import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

function derivar(
  password: string,
  sal: Buffer,
  largo: number,
  opciones: ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, sal, largo, opciones, (err, derivada) => {
      if (err) reject(err);
      else resolve(derivada);
    });
  });
}

// Parámetros de scrypt. Van dentro del propio hash para poder subirlos
// más adelante sin invalidar las contraseñas ya guardadas.
const N = 16384;
const R = 8;
const P = 1;
const LARGO_CLAVE = 64;
const LARGO_SAL = 16;

/**
 * Formato: scrypt:N:r:p:<sal en base64>:<hash en base64>
 *
 * El separador es ":" y no "$" a propósito: el parser de .env de Next.js
 * expande "$" dentro del valor (incluso entre comillas simples) y corrompe
 * el hash al leerlo de ADMIN_PASSWORD_HASH.
 */
export async function hashearPassword(password: string): Promise<string> {
  const sal = randomBytes(LARGO_SAL);
  const derivada = await derivar(password.normalize("NFKC"), sal, LARGO_CLAVE, {
    N,
    r: R,
    p: P,
  });

  return [
    "scrypt",
    N,
    R,
    P,
    sal.toString("base64"),
    derivada.toString("base64"),
  ].join(":");
}

export async function verificarPassword(
  password: string,
  hashGuardado: string
): Promise<boolean> {
  const partes = hashGuardado.split(":");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;

  const [, n, r, p, salBase64, hashBase64] = partes;
  const sal = Buffer.from(salBase64, "base64");
  const esperado = Buffer.from(hashBase64, "base64");

  const derivada = await derivar(password.normalize("NFKC"), sal, esperado.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  return derivada.length === esperado.length && timingSafeEqual(derivada, esperado);
}
