"use client";

import Image from "next/image";
import { useActionState } from "react";
import Link from "next/link";
import type { Drop, Product } from "@prisma/client";
import { updateProductAction } from "@/app/actions";
import { allCategories, categoryLabel } from "@/lib/catalog/categories";
import { formatDiscountEndsAtInput } from "@/lib/pricing";
import { parseImages } from "@/lib/products";

type DropOption = { id: string; name: string; published: boolean };

export function EditarProductoForm({
  product,
  drops,
}: {
  product: Product & { drop: Drop | null };
  drops: DropOption[];
}) {
  const [state, formAction, pending] = useActionState(updateProductAction, {});
  const images = parseImages(product);
  const saleEnds = formatDiscountEndsAtInput(product.discountEndsAt);

  return (
    <div className="min-h-full bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              {product.code}
            </p>
            <h1 className="text-xl font-semibold text-white">Editar prenda</h1>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            ← Volver
          </Link>
        </div>

        <form action={formAction} className="mt-6 space-y-4">
          <input type="hidden" name="id" value={product.id} />

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Drop</span>
            <select
              name="dropId"
              defaultValue={product.dropId ?? ""}
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
          </label>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Categoría</span>
            <select
              name="category"
              defaultValue={product.category}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
            >
              {allCategories().map((cat) => (
                <option key={cat} value={cat}>
                  {categoryLabel(cat)}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
            <legend className="px-1 text-sm font-medium text-zinc-300">Fotos actuales</legend>
            {images.length === 0 ? (
              <p className="text-xs text-zinc-500">Sin fotos guardadas.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {images.map((src) => (
                  <li key={src} className="space-y-1">
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-800">
                      <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-zinc-400">
                      <input
                        type="checkbox"
                        name="keepImage"
                        value={src}
                        defaultChecked
                        className="size-3.5 rounded border-zinc-600 bg-zinc-900 text-amber-500"
                      />
                      Mantener
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block">Agregar fotos (opcional)</span>
              <input
                name="images"
                type="file"
                accept="image/*"
                multiple
                className="w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900 px-3 py-3 text-xs text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:text-white"
              />
            </label>
            <p className="text-xs text-zinc-600">Máximo 7 fotos en total. Desmarca las que quieras quitar.</p>
          </fieldset>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Nombre</span>
            <input
              name="title"
              required
              defaultValue={product.title}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
            />
          </label>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Precio (CLP)</span>
            <input
              name="price"
              type="number"
              inputMode="numeric"
              min={0}
              required
              defaultValue={product.price}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block font-medium text-zinc-300">Talla</span>
              <input
                name="size"
                defaultValue={product.size ?? ""}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block font-medium text-zinc-300">Marca</span>
              <input
                name="brand"
                defaultValue={product.brand ?? ""}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
              />
            </label>
          </div>

          <label className="block text-sm text-zinc-400">
            <span className="mb-1 block font-medium text-zinc-300">Nota</span>
            <textarea
              name="description"
              rows={2}
              defaultValue={product.description ?? ""}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
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
                defaultValue={product.discountPercent ?? ""}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none ring-amber-400/30 focus:ring-2"
              />
            </label>
            <label className="block text-sm text-zinc-400">
              <span className="mb-1 block">Termina el (fecha y hora)</span>
              <input
                name="discountEndsAt"
                type="datetime-local"
                defaultValue={saleEnds}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none ring-amber-400/30 focus:ring-2"
              />
            </label>
            <p className="text-xs text-zinc-600">Deja el % vacío para quitar la oferta.</p>
          </fieldset>

          {state?.error ? (
            <p className="text-sm text-red-400">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}
