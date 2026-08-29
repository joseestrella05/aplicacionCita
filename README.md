# Barbería — Citas

App de reservas para una barbería, con varios barberos. Cada barbero tiene su
propio horario y su propio link permanente para compartir por WhatsApp.

Next.js 16 (App Router), React 19, Drizzle ORM sobre libsql/Turso, Tailwind 4.
Se despliega en Vercel.

## Rutas

| Ruta | Quién entra | Qué hace |
|---|---|---|
| `/` | cualquiera | Elige barbero, o "cualquiera disponible" (busca el cupo más cercano entre todos) |
| `/b/<slug>` | cualquiera | Reserva con un barbero concreto. **Este es el link que el barbero comparte.** |
| `/cita/<token>` | quien tenga el link | El cliente ve y cancela su propia cita, sin cuenta |
| `/admin` | barbero con sesión | Sus citas, su horario y su link. El admin ve además a todos y gestiona barberos |
| `/admin/login` | cualquiera | Elegir barbero y poner su contraseña |

El link `/b/<slug>` **no lleva el horario dentro, lo consulta**. El barbero lo
comparte una vez y no lo vuelve a tocar: si cambia su horario, el link muestra
el horario nuevo al instante.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y completa las variables (ver abajo)
npm run db:migrate           # crea el esquema
npm run dev
```

## Variables de entorno

Todas son obligatorias salvo las de Turso, que en local pueden quedar vacías
(se usa `file:local.db`).

| Variable | Para qué sirve |
|---|---|
| `TURSO_DATABASE_URL` | URL de la base de datos. Vacía en local → `file:local.db` |
| `TURSO_AUTH_TOKEN` | Token de Turso. Vacío en local |
| `JWT_SECRET` | Secreto con el que se firma la cookie de sesión |
| `ADMIN_PASSWORD_HASH` | Contraseña de arranque del administrador (ver abajo) |

Si falta `JWT_SECRET` o `ADMIN_PASSWORD_HASH`, la app **no arranca** y dice qué
variable falta.

Para generar el secreto del JWT:

```bash
openssl rand -base64 48
```

## Cómo generar el hash de una contraseña

Las contraseñas nunca se guardan en texto plano: se guarda un hash **scrypt**
con sal aleatoria.

```bash
node scripts/hash-password.mjs "tu-contraseña"
```

Imprime la línea lista para pegar en `.env.local` o en las variables de entorno
de Vercel:

```
ADMIN_PASSWORD_HASH=scrypt:16384:8:1:<sal en base64>:<hash en base64>
```

El formato es `scrypt:N:r:p:sal:hash`. Los parámetros viajan dentro del propio
hash, así que se pueden subir más adelante sin invalidar las contraseñas ya
guardadas.

> El separador es `:` y no `$` a propósito: el parser de `.env` de Next.js
> expande `$` dentro del valor —incluso entre comillas simples— y corrompería
> el hash.

Este script solo hace falta para `ADMIN_PASSWORD_HASH`. Las contraseñas de los
barberos se ponen desde el panel y se hashean solas.

### Contraseña de arranque

`ADMIN_PASSWORD_HASH` es una contraseña de rescate para el administrador que
todavía no tiene contraseña propia en la base. Sirve para entrar la primera vez
y ponerse una desde el panel; en cuanto la ponga, deja de aceptarse. El panel
avisa mientras siga en ese estado.

## Añadir un barbero nuevo

1. Entra en `/admin` como administrador.
2. En **Barberos → Añadir barbero**, pon el nombre, el link (se propone solo a
   partir del nombre) y una contraseña de al menos 8 caracteres.
3. Pásale al barbero su link `/b/<slug>` y su contraseña.
4. El barbero entra en `/admin/login`, elige su nombre, y ajusta su horario y
   sus días en **Tu horario**.
5. Desde su panel puede copiar su link o compartirlo por WhatsApp con un botón.

El administrador también puede desactivar a un barbero (deja de aparecer en la
portada y su link da 404, pero sus citas se conservan), reactivarlo, cambiarle
la contraseña, o darle rol de administrador. No puede desactivarse ni quitarse
el rol a sí mismo.

## Migraciones

El esquema lo gestiona `drizzle-kit`. La app **no** crea tablas al arrancar: una
base nueva necesita correr las migraciones antes del primer `npm run dev`.

```bash
npm run db:migrate    # aplica las migraciones pendientes de drizzle/
```

Después de tocar `src/db/schema.ts`:

```bash
npm run db:generate   # genera el SQL del cambio en drizzle/
npm run db:migrate    # lo aplica
```

`drizzle.config.ts` apunta a Turso si `TURSO_DATABASE_URL` empieza por
`libsql:`, y a `file:local.db` si está vacía. Carga `.env.local` por su cuenta,
porque drizzle-kit corre fuera de Next.

Las migraciones existentes:

- `0000_inicial` — el esquema de una sola barbería. Usa `IF NOT EXISTS` a
  propósito: tiene que poder correr sobre una base nueva y sobre la que ya
  estaba en producción con sus tablas y sus datos.
- `0001_barberos` — la tabla `barberos`, `barbero_id` y `token` en `citas`, y el
  índice único por barbero. Escrita a mano para no perder ninguna cita: añade
  las columnas nullable, las rellena y luego reconstruye la tabla para dejarlas
  `NOT NULL`. La tabla `configuracion` queda obsoleta pero no se borra.

## Autenticación

El acceso se filtra en `src/proxy.ts`, antes de que la petición llegue a las
páginas o rutas.

> En Next.js 16 el convenio `middleware` está deprecado y se llama `proxy`. Es
> el mismo mecanismo, con la función exportada como `proxy`.

El proxy solo comprueba que haya una sesión válida. **Que un barbero pueda tocar
*ese* recurso lo verifica cada handler contra la base**, porque el proxy no
debería hacer consultas y un cambio de `matcher` podría dejar una ruta
descubierta sin avisar.

| Ruta | Acceso |
|---|---|
| `POST /api/citas` | Público — así reservan los clientes |
| `GET /api/barberos` | Público — solo nombre y slug de los activos |
| `GET /api/disponibilidad?barbero=&fecha=` | Público — solo las horas ocupadas, sin datos de clientes |
| `GET /api/proximo-cupo` | Público — el cupo libre más cercano entre todos |
| `GET`/`PATCH /api/cita/<token>` | Público, pero solo con el token de la cita |
| `GET`/`PATCH /api/citas` | Sesión. Un barbero solo ve y toca las suyas; el admin, todas |
| `GET`/`PUT /api/perfil` | Sesión. Cada barbero, lo suyo |
| `/api/admin/*` | Solo rol `admin` |
| `/admin/*` | Sesión (menos `/admin/login`) |

Sin sesión válida, las rutas de API responden `401` en JSON y las páginas
redirigen a `/admin/login`.

El JWT lleva `{ barberoId, rol }`. Si cambias el rol de un barbero, tiene que
volver a entrar para que su sesión lo refleje.

## Reservas simultáneas

Dos clientes no pueden quedarse con el mismo cupo. No hay `SELECT` previo: lo
decide un índice único parcial sobre `(barbero_id, fecha, hora)` con
`WHERE estado <> 'cancelada'`. El que pierde recibe un `409`. Es parcial a
propósito: cancelar una cita libera el cupo.

Para comprobarlo:

```bash
node scripts/probar-concurrencia.mjs <slug-del-barbero> 2030-01-15 10:00 10
```

Debe dar exactamente un `201` y nueve `409`.

Además hay un límite antispam de 2 citas pendientes por número de teléfono.

## Zona horaria

Toda la app razona en `America/Santo_Domingo`, fijado con `Intl.DateTimeFormat`
en `src/lib/fechas.ts`. La fecha de hoy se calcula en el servidor y llega al
formulario como prop, para que no dependa del reloj del navegador. `creado_en`
se guarda en UTC y se formatea a hora de RD al mostrarlo.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run build        # build de producción
npm run start        # servir el build
npm run lint         # eslint
npm run db:generate  # generar migración desde el esquema
npm run db:migrate   # aplicar migraciones
```
