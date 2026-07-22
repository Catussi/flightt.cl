"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-sm">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-amber-400/90">
          Panel
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Entrar</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Acceso restringido al administrador.
        </p>

        <form action={formAction} className="mt-8 space-y-4">
          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Clave</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/40 focus:ring-2"
              placeholder="••••••••"
            />
          </label>
          {state?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <Link
          href="/"
          className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Ver catálogo público
        </Link>
      </div>
    </div>
  );
}
