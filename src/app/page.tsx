import Link from "next/link";
import SelectorBarbero from "@/components/SelectorBarbero";
import { db } from "@/db";
import { barberos } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const activos = await db
    .select({ id: barberos.id, nombre: barberos.nombre, slug: barberos.slug })
    .from(barberos)
    .where(eq(barberos.activo, true))
    .orderBy(asc(barberos.nombre));

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Barbería</h1>
          <p className="text-zinc-400 mt-2">Elige con quién te quieres cortar</p>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          {activos.length === 0 ? (
            <p className="text-center text-zinc-500 py-6">
              No hay barberos disponibles ahora mismo.
            </p>
          ) : (
            <SelectorBarbero barberos={activos} />
          )}
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Servicio: Corte de cabello
        </p>
        <p className="text-center mt-2">
          <Link href="/admin/login" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors">
            Soy barbero
          </Link>
        </p>
      </div>
    </main>
  );
}
