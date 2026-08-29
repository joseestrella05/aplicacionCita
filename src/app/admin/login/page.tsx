"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BarberoOpcion {
  id: number;
  nombre: string;
  slug: string;
}

export default function LoginPage() {
  const [barberos, setBarberos] = useState<BarberoOpcion[] | null>(null);
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let vigente = true;

    (async () => {
      try {
        const res = await fetch("/api/barberos");
        const data: BarberoOpcion[] = await res.json();
        if (!vigente) return;
        setBarberos(data);
        if (data.length > 0) setSlug(data[0].slug);
      } catch {
        if (vigente) setBarberos([]);
      }
    })();

    return () => {
      vigente = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Error al iniciar sesión");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 mb-4">
            <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Entrar</h1>
          <p className="text-zinc-400 mt-1 text-sm">Elige tu nombre y pon tu contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Barbero</label>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              disabled={barberos === null}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {barberos === null && <option value="">Cargando...</option>}
              {barberos?.map((b) => (
                <option key={b.id} value={b.slug}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !slug}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 text-black font-bold py-3 transition-all"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link href="/" className="text-zinc-500 text-sm hover:text-zinc-400 transition-colors">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
