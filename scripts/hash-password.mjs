#!/usr/bin/env node
/**
 * Genera el hash scrypt para ADMIN_PASSWORD_HASH.
 *
 *   node scripts/hash-password.mjs "mi-contraseña"
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const N = 16384;
const R = 8;
const P = 1;
const LARGO_CLAVE = 64;
const LARGO_SAL = 16;

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash-password.mjs "tu-contraseña"');
  process.exit(1);
}

const sal = randomBytes(LARGO_SAL);
const derivada = await scryptAsync(password.normalize("NFKC"), sal, LARGO_CLAVE, {
  N,
  r: R,
  p: P,
});

const hash = ["scrypt", N, R, P, sal.toString("base64"), derivada.toString("base64")].join(":");

console.log("\nPega esta línea en tu .env.local (o en las variables de Vercel):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log("");
