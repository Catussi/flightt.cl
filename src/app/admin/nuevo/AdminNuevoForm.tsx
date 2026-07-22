"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createProductAction } from "@/app/actions";
import { allCategories, categoryLabel } from "@/lib/catalog/categories";

type DropOption = { id: string; name: string; published: boolean };

export function AdminNuevoForm({
  drops,
  defaultDropId,
}: {
  drops: DropOption[];
  defaultDropId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    {},
  );

  return (
    <div className="min-h-full bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              Carga rápida
            </p>
            <h1 className="text-xl font-semibold text-white">Nueva prenda</h1>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Volver
          </Link>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Drop</span>
            <select
              name="dropId"
              defaultValue={defaultDropId}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
            >
              <option value="">Sin drop</option>
              {drops.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {!d.published ? " (borrador)" : ""}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-zinc-600">
              Se asigna al destacado o al último publicado por defecto.
            </span>
          </label>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Categoría</span>
            <select
              name="category"
              defaultValue="TOP"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
            >
              {allCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabel(cat)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">
              Fotos (máx. 7)
            </span>
            <input
              name="images"
              type="file"
              accept="image/*"
              multiple
              required
              className="w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-3 py-3 text-xs text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:text-white"
            />
          </label>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Nombre</span>
            <input
              name="title"
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
              placeholder="Ej: Chaqueta Jordan puffer"
            />
          </label>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">
              Precio (CLP)
            </span>
            <input
              name="price"
              type="number"
              inputMode="numeric"
              min={0}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
              placeholder="29990"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block font-medium text-zinc-300">Talla</span>
              <input
                name="size"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
                placeholder="M / 32 / OS"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block font-medium text-zinc-300">Marca</span>
              <input
                name="brand"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
                placeholder="Opcional"
              />
            </label>
          </div>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Nota</span>
            <textarea
              name="description"
              rows={2}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
              placeholder="Estado, medidas, cómo coordinar envío…"
            />
          </label>

          <fieldset className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <legend className="px-1 text-sm font-medium text-zinc-300">Oferta (opcional)</legend>
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block">Descuento %</span>
              <input
                name="discountPercent"
                type="number"
                min={1}
                max={90}
                placeholder="Ej: 20"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none ring-amber-400/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block">Termina el (fecha y hora)</span>
              <input
                name="discountEndsAt"
                type="datetime-local"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none ring-amber-400/30 focus:ring-2"
              />
            </label>
            <p className="text-xs text-zinc-600">
              Si dejas el % vacío, no hay oferta. Con descuento activo aparece en /ofertas.
            </p>
          </fieldset>

          {state?.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Publicar prenda"}
          </button>
        </form>
      </div>
    </div>
  );
}
