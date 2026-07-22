"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { Drop } from "@prisma/client";
import { updateDropAction } from "@/app/actions";

export function EditarDropForm({ drop }: { drop: Drop }) {
  const [state, formAction, pending] = useActionState(updateDropAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={drop.id} />

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Nombre del drop</span>
        <input
          name="name"
          required
          defaultValue={drop.name}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Slug URL</span>
        <input
          name="slug"
          defaultValue={drop.slug}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
        />
        <span className="mt-1 block text-xs text-zinc-600">
          Enlace actual: /d/{drop.slug}
        </span>
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Horarios / fechas</span>
        <textarea
          name="schedule"
          rows={3}
          defaultValue={drop.schedule ?? ""}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Ubicación</span>
        <input
          name="location"
          defaultValue={drop.location ?? ""}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block font-medium text-zinc-300">Nota</span>
        <textarea
          name="note"
          rows={2}
          defaultValue={drop.note ?? ""}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
        />
      </label>

      <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            name="published"
            defaultChecked={drop.published}
            className="size-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
          />
          Publicado
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-zinc-300">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={drop.featured}
            className="size-4 rounded border-zinc-600 bg-zinc-900 text-amber-500"
          />
          Destacar en inicio
        </label>
      </div>

      {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
        <Link
          href="/admin/drops"
          className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 hover:border-zinc-500"
        >
          Volver
        </Link>
      </div>
    </form>
  );
}
