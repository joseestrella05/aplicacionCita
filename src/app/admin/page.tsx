"use client";

import { useRouter } from "next/navigation";
import AppointmentList from "@/components/AppointmentList";
import ScheduleConfig from "@/components/ScheduleConfig";

// El acceso se verifica en src/proxy.ts antes de que esta página se renderice.
export default function AdminPage() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-3 sm:px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Citas</h1>
            <p className="text-zinc-400 text-sm">Gestiona las citas de tus clientes</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-2 border border-zinc-700 transition-all"
          >
            Salir
          </button>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6">
          <AppointmentList />
        </div>

        <ScheduleConfig />
      </div>
    </main>
  );
}
