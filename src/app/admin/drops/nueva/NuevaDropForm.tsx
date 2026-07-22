"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createDropAction } from "@/app/actions";

export function NuevaDropForm() {
  const [state, formAction, pending] = useActionState(createDropAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Nombre del drop</span>
        <input
          name="name"
          required
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
          placeholder="Ej: Drop feria mayo · +70 prendas"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">
          Slug URL (opcional)
        </span>
        <input
          name="slug"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
          placeholder="Se genera solo si lo dejas vacío"
        />
        <span className="mt-1 block text-xs text-zinc-600">
          Queda como /d/tu-slug — sin espacios.
        </span>
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Horarios / fechas</span>
        <textarea
          name="schedule"
          rows={3}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
          placeholder={"Vie y sáb Achupallas\nDom Feria Caupolicán frente a Copec"}
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Ubicación</span>
        <input
          name="location"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
          placeholder="Dónde verte en la feria"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Nota</span>
        <textarea
          name="note"
          rows={2}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
          placeholder="Políticas, envío Starken, sin cambios…"
        />
      </label>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            name="published"
            defaultChecked
            className="size-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
          />
          Publicado (visible en la tienda)
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            name="featured"
            className="size-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
          />
          Destacar en la página principal (banner)
        </label>
      </div>

      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Creando…" : "Crear drop"}
        </button>
        <Link
          href="/admin/drops"
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
