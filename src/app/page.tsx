import BookingForm, { type Horario } from "@/components/BookingForm";
import { db } from "@/db";
import { configuracion } from "@/db/schema";

export const dynamic = "force-dynamic";

async function obtenerHorario(): Promise<Horario> {
  const filas = await db.select().from(configuracion);
  const valores: Record<string, string> = {};
  filas.forEach((fila) => {
    valores[fila.clave] = fila.valor;
  });

  return {
    horaInicio: valores.hora_inicio || "09:00",
    horaFin: valores.hora_fin || "19:00",
    duracionCita: Number(valores.duracion_cita) || 60,
  };
}

export default async function Home() {
  const horario = await obtenerHorario();

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Barbería
          </h1>
          <p className="text-zinc-400 mt-2">
            Agenda tu corte de cabello
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6">
          <BookingForm horario={horario} />
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Servicio: Corte de cabello
        </p>
      </div>
    </main>
  );
}
