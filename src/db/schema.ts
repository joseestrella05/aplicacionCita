import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const citas = sqliteTable(
  "citas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombreCliente: text("nombre_cliente").notNull(),
    telefono: text("telefono").notNull(),
    fecha: text("fecha").notNull(),
    hora: text("hora").notNull(),
    estado: text("estado", { enum: ["pendiente", "completada", "cancelada"] })
      .notNull()
      .default("pendiente"),
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now', 'localtime'))`),
  },
  (t) => [
    // Índice parcial a propósito: una cita cancelada libera el cupo.
    // Es lo que impide que dos reservas simultáneas ocupen el mismo horario.
    uniqueIndex("cita_unica")
      .on(t.fecha, t.hora)
      .where(sql`${t.estado} <> 'cancelada'`),
  ]
);

export const configuracion = sqliteTable("configuracion", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clave: text("clave").notNull().unique(),
  valor: text("valor").notNull(),
});

export type Cita = typeof citas.$inferSelect;
export type NuevaCita = typeof citas.$inferInsert;
export type Configuracion = typeof configuracion.$inferSelect;
