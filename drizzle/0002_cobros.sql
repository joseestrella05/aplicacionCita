--> Cobros y propinas.
--> Al contrario que 0001, este SQL de drizzle-kit sí sirve tal cual: el
--> NOT NULL de precio_pela lleva un default constante, y eso SQLite lo acepta
--> en un ALTER TABLE ADD COLUMN aunque la tabla tenga filas.
--> Las citas ya completadas quedan con monto_cobrado NULL: no se inventa
--> ingreso que nadie registró. Los informes las cuentan aparte y se pueden
--> rellenar a mano desde el panel.
ALTER TABLE `barberos` ADD `precio_pela` integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE `citas` ADD `monto_cobrado` integer;--> statement-breakpoint
ALTER TABLE `citas` ADD `precio_aplicado` integer;