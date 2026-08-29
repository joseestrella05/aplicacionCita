import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/auth";

// En Next.js 16 el convenio `middleware` está deprecado y se llama `proxy`.
// Corre en el runtime de Node por defecto.
export const config = {
  matcher: ["/admin/:path*", "/api/citas", "/api/perfil", "/api/admin/:path*"],
};

function esPublica(request: NextRequest): boolean {
  const { pathname } = request.nextUrl;

  // El login tiene que ser accesible sin sesión.
  if (pathname === "/admin/login") return true;

  // Así reservan los clientes.
  if (pathname === "/api/citas" && request.method === "POST") return true;

  return false;
}

export async function proxy(request: NextRequest) {
  if (esPublica(request)) return NextResponse.next();

  const sesion = await verificarToken(
    request.cookies.get(COOKIE_SESION)?.value
  );

  // El proxy solo comprueba que haya sesión válida. Que el barbero pueda
  // tocar *ese* recurso lo verifica cada handler contra la base, porque el
  // proxy no debería hacer consultas y un cambio de matcher podría dejar
  // una ruta descubierta sin avisar.
  if (sesion) {
    if (request.nextUrl.pathname.startsWith("/api/admin/") && sesion.rol !== "admin") {
      return NextResponse.json({ error: "Solo para el administrador" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const destino = request.nextUrl.clone();
  destino.pathname = "/admin/login";
  destino.search = "";
  return NextResponse.redirect(destino);
}
