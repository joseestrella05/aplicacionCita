import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// drizzle-kit corre fuera de Next, así que las variables de .env.local
// hay que cargarlas a mano.
loadEnvConfig(process.cwd());

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig(
  url.startsWith("libsql:") || url.startsWith("https:")
    ? {
        dialect: "turso",
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dbCredentials: { url, authToken },
      }
    : {
        dialect: "sqlite",
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dbCredentials: { url },
      }
);
