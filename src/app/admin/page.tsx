import { redirect } from "next/navigation";
import { headers } from "next/headers";
import PanelCitas from "@/components/PanelCitas";
import ScheduleConfig from "@/components/ScheduleConfig";
import BarberosAdmin from "@/components/BarberosAdmin";
import EnlacePublico from "@/components/EnlacePublico";
import BotonSalir from "@/components/BotonSalir";
import { barberoEnSesion } from "@/lib/sesion";
import { parsearDias } from "@/lib/horario";

export const dynamic = "force-dynamic";

// El acceso ya lo filtra src/proxy.ts; aquí se vuelve a leer la sesión
// porque hace falta saber *quién* es para decidir qué mostrar.
export default async function AdminPage() {
  const yo = await barberoEnSesion();

  if (!yo) redirect("/admin/login");

  const esAdmin = yo.rol === "admin";

  // La URL pública se arma en el servidor, con el host real de la petición.
  const cabeceras = await headers();
  const host = cabeceras.get("x-forwarded-host") ?? cabeceras.get("host") ?? "";
  const protocolo = cabeceras.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const enlacePublico = `${protocolo}://${host}/b/${yo.slug}`;

  return (
    <main className="min-h-screen bg-zinc-950 px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">{yo.nombre}</h1>
            <p className="text-zinc-400 text-sm">
              {esAdmin
                ? "Administrador — gestionas los barberos"
                : "Gestiona tus citas y tu horario"}
            </p>
          </div>
          <BotonSalir />
        </div>

        {yo.passwordHash === "" && (
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              Estás entrando con la contraseña de arranque
              (<code>ADMIN_PASSWORD_HASH</code>). Ponte una propia en
              &quot;Barberos&quot; → Cambiar contraseña.
            </p>
          </div>
        )}

        <EnlacePublico nombre={yo.nombre} enlace={enlacePublico} />

        <PanelCitas precioPela={yo.precioPela} />

        <ScheduleConfig
          inicial={{
            horaInicio: yo.horaInicio,
            horaFin: yo.horaFin,
            duracionCita: yo.duracionCita,
            diasLaborales: parsearDias(yo.diasLaborales),
            precioPela: yo.precioPela,
          }}
        />

        {esAdmin && <BarberosAdmin miId={yo.id} />}
      </div>
    </main>
  );
}
