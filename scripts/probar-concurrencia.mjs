#!/usr/bin/env node
/**
 * Dispara N reservas simultáneas al mismo cupo. Solo una debe entrar.
 *
 *   node scripts/probar-concurrencia.mjs [fecha] [hora] [n]
 *
 * Requiere la app corriendo (npm run dev).
 * Cada petición usa un teléfono distinto para no chocar con el
 * límite antispam de citas pendientes por número.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const fecha = process.argv[2] ?? "2030-01-15";
const hora = process.argv[3] ?? "10:00";
const n = Number(process.argv[4] ?? 10);

const respuestas = await Promise.all(
  Array.from({ length: n }, (_, i) =>
    fetch(`${BASE}/api/citas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreCliente: `Concurrencia ${i}`,
        telefono: `809-999-${String(i).padStart(4, "0")}`,
        fecha,
        hora,
      }),
    }).then(async (res) => ({ status: res.status, body: await res.json() }))
  )
);

const porEstado = respuestas.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] ?? 0) + 1;
  return acc;
}, {});

console.log(`\n${n} POST simultáneos a ${fecha} ${hora}\n`);
for (const [status, cuenta] of Object.entries(porEstado).sort()) {
  const ejemplo = respuestas.find((r) => String(r.status) === status);
  console.log(`  ${status} x${cuenta}  ${JSON.stringify(ejemplo.body)}`);
}

const creadas = porEstado[201] ?? 0;
const ocupadas = porEstado[409] ?? 0;
const ok = creadas === 1 && ocupadas === n - 1;

console.log(`\n${ok ? "✓" : "✗"} esperado: 1 x 201 y ${n - 1} x 409 — obtenido: ${creadas} x 201 y ${ocupadas} x 409\n`);
process.exit(ok ? 0 : 1);
