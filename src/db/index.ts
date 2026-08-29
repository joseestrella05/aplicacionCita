import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Solo el cliente. El esquema lo gestionan las migraciones de drizzle-kit
// (carpeta drizzle/): `npm run db:generate` y `npm run db:migrate`.
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
