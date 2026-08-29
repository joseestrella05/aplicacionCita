import { notFound } from "next/navigation";
import Link from "next/link";
import CancelarCita from "@/components/CancelarCita";
import { db } from "@/db";
import { barberos, citas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NOMBRES_DIAS, diaDeLaSemana } from "@/lib/horario";

export const dynamic = "force-dynamic";

// Pública, pero solo accesible con el token que recibió el cliente al
// reservar. No se puede listar ni adivinar.
export default async function VerCita({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [cita] = await db
    .select({
      nombreCliente: citas.nombreCliente,
      telefono: citas.telefono,
      fecha: citas.fecha,
      hora: citas.hora,
      estado: citas.estado,
      barberoNombre: barberos.nombre,
    })
    .from(citas)
    .innerJoin(barberos, eq(citas.barberoId, barberos.id))
    .where(eq(citas.token, token));

  if (!cita) notFound();

  const dia = NOMBRES_DIAS[diaDeLaSemana(cita.fecha)];

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Tu cita</h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Guarda este enlace para volver a consultarla
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="space-y-4">
            <div>
              <p className="text-zinc-500 text-xs">Cliente</p>
              <p className="text-white font-medium">{cita.nombreCliente}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Barbero</p>
              <p className="text-white font-medium">{cita.barberoNombre}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs">Cuándo</p>
              <p className="text-amber-400 font-semibold text-lg">
                {dia} {cita.fecha} a las {cita.hora}
              </p>
            </div>
          </div>

          <CancelarCita token={token} estadoInicial={cita.estado} />
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
