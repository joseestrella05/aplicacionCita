import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS citas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_cliente TEXT NOT NULL,
    telefono TEXT NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    creado_en TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

await client.execute(`
  CREATE TABLE IF NOT EXISTS configuracion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT NOT NULL UNIQUE,
    valor TEXT NOT NULL
  )
`);

// Índice parcial: bloquea dos citas en el mismo cupo, pero deja que una
// cita cancelada lo libere.
await client.execute(`
  CREATE UNIQUE INDEX IF NOT EXISTS cita_unica
    ON citas (fecha, hora)
    WHERE estado <> 'cancelada'
`);

const existingConfig = await client.execute("SELECT COUNT(*) as count FROM configuracion");
const count = existingConfig.rows[0]?.count as number;

if (count === 0) {
  await client.execute("INSERT INTO configuracion (clave, valor) VALUES ('hora_inicio', '09:00')");
  await client.execute("INSERT INTO configuracion (clave, valor) VALUES ('hora_fin', '19:00')");
  await client.execute("INSERT INTO configuracion (clave, valor) VALUES ('duracion_cita', '60')");
}

export const db = drizzle(client, { schema });
