--> Migración inicial. Refleja el esquema que la app venía creando a mano
--> desde src/db/index.ts con CREATE TABLE IF NOT EXISTS.
--> Se mantiene el IF NOT EXISTS a propósito: esta migración tiene que poder
--> correr tanto sobre una base nueva como sobre la que ya está en producción,
--> que ya tiene estas tablas y datos.
CREATE TABLE IF NOT EXISTS `citas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre_cliente` text NOT NULL,
	`telefono` text NOT NULL,
	`fecha` text NOT NULL,
	`hora` text NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `cita_unica` ON `citas` (`fecha`,`hora`) WHERE "citas"."estado" <> 'cancelada';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `configuracion` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clave` text NOT NULL,
	`valor` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `configuracion_clave_unique` ON `configuracion` (`clave`);--> statement-breakpoint
--> Horario por defecto. Antes se insertaba con top-level await en cada
--> arranque en frío; aquí corre una sola vez.
INSERT OR IGNORE INTO `configuracion` (`clave`, `valor`) VALUES ('hora_inicio', '09:00');--> statement-breakpoint
INSERT OR IGNORE INTO `configuracion` (`clave`, `valor`) VALUES ('hora_fin', '19:00');--> statement-breakpoint
INSERT OR IGNORE INTO `configuracion` (`clave`, `valor`) VALUES ('duracion_cita', '60');
