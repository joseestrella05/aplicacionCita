"use client";

import { useState, useEffect } from "react";
import { NOMBRES_DIAS } from "@/lib/horario";
import { generarSlug } from "@/lib/slug";

interface BarberoAdmin {
  id: number;
  nombre: string;
  slug: string;
  rol: "barbero" | "admin";
  activo: boolean;
  horaInicio: string;
  horaFin: string;
  duracionCita: number;
  diasLaborales: number[];
  tienePassword: boolean;
}

export default function BarberosAdmin({ miId }: { miId: number }) {
  const [barberos, setBarberos] = useState<BarberoAdmin[] | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"barbero" | "admin">("barbero");
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const res = await fetch("/api/admin/barberos");
        const data = await res.json();
        if (!vigente) return;
        if (!res.ok) {
          setError(data.error || "No se pudieron cargar los barberos");
          setBarberos([]);
          return;
        }
        setBarberos(data);
      } catch {
        if (vigente) setBarberos([]);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [recarga]);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setCreando(true);

    try {
      const res = await fetch("/api/admin/barberos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          slug: slug || generarSlug(nombre),
          password,
          rol,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo crear");
        return;
      }

      setMensaje(`${nombre} creado. Su link es /b/${data.slug}`);
      setNombre("");
      setSlug("");
      setPassword("");
      setRol("barbero");
      setRecarga((n) => n + 1);
    } catch {
      setError("Error de conexión");
    } finally {
      setCreando(false);
    }
  }

  async function actualizar(id: number, cambios: Record<string, unknown>) {
    setError("");
    setMensaje("");

    try {
      const res = await fetch("/api/admin/barberos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...cambios }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo actualizar");
        return;
      }

      setRecarga((n) => n + 1);
    } catch {
      setError("Error de conexión");
    }
  }

  async function cambiarPassword(id: number, nombreBarbero: string) {
    const nueva = prompt(`Nueva contraseña para ${nombreBarbero} (mínimo 8 caracteres):`);
    if (!nueva) return;
    await actualizar(id, { password: nueva });
    setMensaje(`Contraseña de ${nombreBarbero} actualizada`);
  }

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-6 mt-6">
      <h2 className="text-lg font-semibold text-white mb-4">Barberos</h2>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-2 text-green-400 text-sm mb-4">
          {mensaje}
        </div>
      )}

      {barberos === null ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {barberos.map((b) => (
            <div
              key={b.id}
              className={`rounded-xl border p-4 ${
                b.activo
                  ? "bg-zinc-800/50 border-zinc-700/50"
                  : "bg-zinc-900 border-zinc-800 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {b.nombre}
                    {b.id === miId && (
                      <span className="text-zinc-500 text-sm font-normal"> (tú)</span>
                    )}
                  </h3>
                  <p className="text-amber-400 text-sm mt-1">/b/{b.slug}</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    {b.horaInicio}–{b.horaFin} · {b.duracionCita} min ·{" "}
                    {b.diasLaborales.map((d) => NOMBRES_DIAS[d].slice(0, 3)).join(", ")}
                  </p>
                  {!b.tienePassword && (
                    <p className="text-yellow-400 text-xs mt-1">
                      Todavía no tiene contraseña propia
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      b.rol === "admin"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-zinc-700/50 text-zinc-400"
                    }`}
                  >
                    {b.rol}
                  </span>
                  {!b.activo && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 whitespace-nowrap">
                      inactivo
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-700/50">
                <button
                  onClick={() => cambiarPassword(b.id, b.nombre)}
                  className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 px-3 border border-zinc-700 transition-all"
                >
                  Cambiar contraseña
                </button>
                {b.id !== miId && (
                  <>
                    <button
                      onClick={() => actualizar(b.id, { activo: !b.activo })}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 px-3 border border-zinc-700 transition-all"
                    >
                      {b.activo ? "Desactivar" : "Reactivar"}
                    </button>
                    <button
                      onClick={() =>
                        actualizar(b.id, { rol: b.rol === "admin" ? "barbero" : "admin" })
                      }
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium py-2 px-3 border border-zinc-700 transition-all"
                    >
                      {b.rol === "admin" ? "Quitar admin" : "Hacer admin"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={crear} className="border-t border-zinc-800 pt-6 space-y-3">
        <h3 className="text-white font-medium">Añadir barbero</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Carlos Peña"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Link (opcional)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder={nombre ? generarSlug(nombre) : "carlos-pena"}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Rol</label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value as "barbero" | "admin")}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="barbero">Barbero</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={creando}
          className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-medium py-2 px-4 text-sm transition-all"
        >
          {creando ? "Creando..." : "Crear barbero"}
        </button>
      </form>
    </div>
  );
}
