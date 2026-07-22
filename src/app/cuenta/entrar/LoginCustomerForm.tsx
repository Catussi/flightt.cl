"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginCustomerAction } from "@/app/cuenta/actions";

export function LoginCustomerForm() {
  const [state, formAction, pending] = useActionState(loginCustomerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Correo</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>
      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Clave</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>
      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        ¿No tienes cuenta?{" "}
        <Link href="/cuenta/registro" className="text-amber-400 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
