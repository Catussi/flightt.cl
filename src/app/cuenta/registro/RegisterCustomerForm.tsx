"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerCustomerAction } from "@/app/cuenta/actions";

export function RegisterCustomerForm() {
  const [state, formAction, pending] = useActionState(registerCustomerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block font-medium text-zinc-300">Nombre</span>
          <input
            name="firstName"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
          />
        </label>
        <label className="block text-sm text-zinc-400">
          <span className="mb-1 block font-medium text-zinc-300">Apellido</span>
          <input
            name="lastName"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
          />
        </label>
      </div>
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
        <span className="mb-1 block font-medium text-zinc-300">Clave (mín. 8)</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>
      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        ¿Ya tienes cuenta?{" "}
        <Link href="/cuenta/entrar" className="text-amber-400 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
