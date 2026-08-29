import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const barberos = sqliteTable("barberos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull(),
  /** Va en la URL pública: /b/jose */
  slug: text("slug").notNull().unique(),
  passwordHash: text("password_hash").notNull().default(""),
  horaInicio: text("hora_inicio").notNull().default("09:00"),
  horaFin: text("hora_fin").notNull().default("19:00"),
  duracionCita: integer("duracion_cita").notNull().default(60),
  /** Días de la semana en los que trabaja, 0=domingo … 6=sábado. */
  diasLaborales: text("dias_laborales").notNull().default("1,2,3,4,5,6"),
  rol: text("rol", { enum: ["barbero", "admin"] })
    .notNull()
    .default("barbero"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const citas = sqliteTable(
  "citas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    barberoId: integer("barbero_id")
      .notNull()
      .references(() => barberos.id),
    nombreCliente: text("nombre_cliente").notNull(),
    telefono: text("telefono").notNull(),
    fecha: text("fecha").notNull(),
    hora: text("hora").notNull(),
    estado: text("estado", { enum: ["pendiente", "completada", "cancelada"] })
      .notNull()
      .default("pendiente"),
    /** Permite al cliente ver y cancelar su propia cita sin cuenta. */
    token: text("token").notNull().unique(),
    // UTC. Se formatea a hora de RD al mostrar (src/lib/fechas.ts).
    creadoEn: text("creado_en")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [
    // Índice parcial a propósito: una cita cancelada libera el cupo.
    // Incluye barbero_id: dos barberos pueden tener cita a la misma hora.
    uniqueIndex("cita_unica")
      .on(t.barberoId, t.fecha, t.hora)
      .where(sql`${t.estado} <> 'cancelada'`),
  ]
);

/**
 * @deprecated Sustituida por la tabla `barberos`, que guarda el horario de
 * cada uno. Se conserva sin usar para no perder datos; se puede borrar en
 * una migración futura.
 */
export const configuracion = sqliteTable("configuracion", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clave: text("clave").notNull().unique(),
  valor: text("valor").notNull(),
});

export type Barbero = typeof barberos.$inferSelect;
export type NuevoBarbero = typeof barberos.$inferInsert;
export type Cita = typeof citas.$inferSelect;
export type NuevaCita = typeof citas.$inferInsert;
export type Configuracion = typeof configuracion.$inferSelect;
export type Rol = Barbero["rol"];
