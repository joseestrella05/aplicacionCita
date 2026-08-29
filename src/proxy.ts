import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarToken } from "@/lib/auth";

// En Next.js 16 el convenio `middleware` está deprecado y se llama `proxy`.
// Corre en el runtime de Node por defecto.
export const config = {
  matcher: ["/admin/:path*", "/api/citas", "/api/configuracion"],
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

  if (sesion) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const destino = request.nextUrl.clone();
  destino.pathname = "/admin/login";
  destino.search = "";
  return NextResponse.redirect(destino);
}
