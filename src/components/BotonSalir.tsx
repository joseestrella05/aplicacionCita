"use client";

import { useRouter } from "next/navigation";

export default function BotonSalir() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="w-full sm:w-auto rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-2 border border-zinc-700 transition-all"
    >
      Salir
    </button>
  );
}
