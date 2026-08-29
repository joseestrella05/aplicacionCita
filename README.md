# Barbería — Citas

App de reservas para una barbería, construida con Next.js 16 (App Router), Drizzle ORM sobre libsql/Turso y Tailwind 4.

- `/` — reserva pública
- `/admin` — panel de citas y horario (requiere sesión)
- `/admin/login` — acceso al panel

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # y completa las variables (ver abajo)
npm run dev
```

## Variables de entorno

Todas son obligatorias salvo las de Turso, que en local pueden quedar vacías (se usa `file:local.db`).

| Variable | Para qué sirve |
|---|---|
| `TURSO_DATABASE_URL` | URL de la base de datos. Vacía en local → `file:local.db` |
| `TURSO_AUTH_TOKEN` | Token de Turso. Vacío en local |
| `JWT_SECRET` | Secreto con el que se firma la cookie de sesión |
| `ADMIN_PASSWORD_HASH` | Hash scrypt de la contraseña del panel |

Si falta `JWT_SECRET` o `ADMIN_PASSWORD_HASH`, la app **no arranca** y muestra qué variable falta.

Para generar el secreto del JWT:

```bash
openssl rand -base64 48
```

## Cómo generar el hash de la contraseña

La contraseña nunca se guarda en texto plano. Se guarda un hash **scrypt** con sal aleatoria, generado con este script:

```bash
node scripts/hash-password.mjs "tu-contraseña"
```

Imprime la línea lista para pegar en `.env.local` o en las variables de entorno de Vercel:

```
ADMIN_PASSWORD_HASH=scrypt:16384:8:1:<sal en base64>:<hash en base64>
```

El formato es `scrypt:N:r:p:sal:hash`. Los parámetros viajan dentro del propio hash, así que se pueden subir más adelante sin invalidar las contraseñas ya guardadas.

> El separador es `:` y no `$` a propósito: el parser de `.env` de Next.js expande `$` dentro del valor —incluso entre comillas simples— y corrompería el hash.

Para cambiar la contraseña, vuelve a correr el script y reemplaza el valor de `ADMIN_PASSWORD_HASH`.

## Autenticación

El acceso se verifica en `src/proxy.ts`, antes de que la petición llegue a las páginas o rutas.

> En Next.js 16 el convenio `middleware` está deprecado y se llama `proxy`. Es el mismo mecanismo, con la función exportada como `proxy`.

| Ruta | Acceso |
|---|---|
| `POST /api/citas` | Público — así reservan los clientes |
| `GET /api/disponibilidad?fecha=AAAA-MM-DD` | Público — devuelve solo las horas ocupadas, sin datos de clientes |
| `GET`/`PATCH /api/citas` | Requiere sesión |
| `GET`/`PUT /api/configuracion` | Requiere sesión |
| `/admin/*` | Requiere sesión (menos `/admin/login`) |

Sin sesión válida, las rutas de API responden `401` en JSON y las páginas redirigen a `/admin/login`.

## Comandos

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # eslint
```
