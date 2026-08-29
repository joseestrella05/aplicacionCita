--> Varios barberos.
--> Escrita a mano: el SQL que genera drizzle-kit hace
--> `ALTER TABLE citas ADD barbero_id integer NOT NULL` sin default, y SQLite
--> rechaza eso en una tabla que ya tiene filas. Aquí se añade la columna
--> nullable, se rellena, y al final se reconstruye la tabla para dejarla
--> NOT NULL. No se pierde ninguna cita.

--> 1. La tabla de barberos.
CREATE TABLE `barberos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`slug` text NOT NULL,
	`password_hash` text DEFAULT '' NOT NULL,
	`hora_inicio` text DEFAULT '09:00' NOT NULL,
	`hora_fin` text DEFAULT '19:00' NOT NULL,
	`duracion_cita` integer DEFAULT 60 NOT NULL,
	`dias_laborales` text DEFAULT '1,2,3,4,5,6' NOT NULL,
	`rol` text DEFAULT 'barbero' NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `barberos_slug_unique` ON `barberos` (`slug`);--> statement-breakpoint

--> 2. El barbero que ya existía, con el horario que estaba en `configuracion`.
--> Queda como admin: es quien podrá dar de alta a los demás.
INSERT INTO `barberos` (`id`, `nombre`, `slug`, `password_hash`, `hora_inicio`, `hora_fin`, `duracion_cita`, `dias_laborales`, `rol`, `activo`)
SELECT
	1,
	'Barbero',
	'barbero',
	'',
	COALESCE((SELECT `valor` FROM `configuracion` WHERE `clave` = 'hora_inicio'), '09:00'),
	COALESCE((SELECT `valor` FROM `configuracion` WHERE `clave` = 'hora_fin'), '19:00'),
	COALESCE((SELECT CAST(`valor` AS INTEGER) FROM `configuracion` WHERE `clave` = 'duracion_cita'), 60),
	'1,2,3,4,5,6',
	'admin',
	1
WHERE NOT EXISTS (SELECT 1 FROM `barberos`);--> statement-breakpoint

--> 3. Las columnas nuevas de citas, todavía nullable.
ALTER TABLE `citas` ADD `barbero_id` integer;--> statement-breakpoint
ALTER TABLE `citas` ADD `token` text;--> statement-breakpoint

--> 4. Todas las citas que ya existen son del barbero 1, y cada una recibe
--> su propio token para que el cliente pueda consultarla y cancelarla.
UPDATE `citas` SET `barbero_id` = 1 WHERE `barbero_id` IS NULL;--> statement-breakpoint
UPDATE `citas` SET `token` = lower(hex(randomblob(16))) WHERE `token` IS NULL;--> statement-breakpoint

--> 5. Reconstrucción de `citas`: deja barbero_id y token en NOT NULL, añade
--> la FK a barberos y corrige el DEFAULT de creado_en a UTC (la tabla vieja
--> seguía con datetime('now','localtime') porque el CREATE TABLE IF NOT
--> EXISTS del arranque nunca la tocaba).
DROP INDEX IF EXISTS `cita_unica`;--> statement-breakpoint
CREATE TABLE `citas_nueva` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barbero_id` integer NOT NULL REFERENCES `barberos`(`id`),
	`nombre_cliente` text NOT NULL,
	`telefono` text NOT NULL,
	`fecha` text NOT NULL,
	`hora` text NOT NULL,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`token` text NOT NULL,
	`creado_en` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `citas_nueva` (`id`, `barbero_id`, `nombre_cliente`, `telefono`, `fecha`, `hora`, `estado`, `token`, `creado_en`)
SELECT `id`, `barbero_id`, `nombre_cliente`, `telefono`, `fecha`, `hora`, `estado`, `token`, `creado_en` FROM `citas`;--> statement-breakpoint
DROP TABLE `citas`;--> statement-breakpoint
ALTER TABLE `citas_nueva` RENAME TO `citas`;--> statement-breakpoint

--> 6. Los índices sobre la tabla reconstruida. `cita_unica` ahora incluye
--> barbero_id: dos barberos pueden tener cita a la misma hora.
CREATE UNIQUE INDEX `citas_token_unique` ON `citas` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `cita_unica` ON `citas` (`barbero_id`,`fecha`,`hora`) WHERE "citas"."estado" <> 'cancelada';--> statement-breakpoint

--> 7. `configuracion` queda obsoleta pero no se borra.
INSERT OR IGNORE INTO `configuracion` (`clave`, `valor`)
VALUES ('_obsoleta', 'Reemplazada por la tabla barberos en la migracion 0001. Ya no la lee nadie.');
