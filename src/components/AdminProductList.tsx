"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { Drop, Product } from "@prisma/client";
import {
  adjustProductSortAction,
  markAvailableAction,
  markSoldAction,
  pinProductFirstAction,
} from "@/app/actions";
import { formatCLP, parseImages } from "@/lib/products";
import { getSaleInfo } from "@/lib/pricing";

export type ProductWithDrop = Product & { drop: Drop | null };

type DropMini = { id: string; name: string };

type Props = {
  products: ProductWithDrop[];
  drops: DropMini[];
};

export function AdminProductList({ products, drops }: Props) {
  const [q, setQ] = useState("");
  const [showSold, setShowSold] = useState(true);
  const [dropFilter, setDropFilter] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      if (!showSold && p.status === "SOLD") return false;
      if (dropFilter === "__none__") {
        if (p.dropId) return false;
      } else if (dropFilter) {
        if (p.dropId !== dropFilter) return false;
      }
      if (!s) return true;
      const blob = [
        p.code,
        p.title,
        p.brand ?? "",
        p.size ?? "",
        String(p.price),
        p.drop?.name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(s);
    });
  }, [products, q, showSold, dropFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, marca, talla, drop…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-base text-white outline-none ring-amber-400/30 focus:ring-2"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="block flex-1 text-sm text-zinc-400">
            <span className="mb-1 block text-xs font-medium text-zinc-500">
              Filtrar por drop
            </span>
            <select
              value={dropFilter}
              onChange={(e) => setDropFilter(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none ring-amber-400/30 focus:ring-2"
            >
              <option value="">Todos los drops</option>
              <option value="__none__">Sin drop</option>
              {drops.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex shrink-0 items-center gap-2 text-sm text-zinc-400 sm:pt-6">
            <input
              type="checkbox"
              checked={showSold}
              onChange={(e) => setShowSold(e.target.checked)}
              className="size-4 rounded border-zinc-600 bg-zinc-900 text-amber-500 focus:ring-amber-400"
            />
            Mostrar vendidas
          </label>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filtered.map((p) => {
          const imgs = parseImages(p);
          const src = imgs[0];
          const sold = p.status === "SOLD";
          const sale = getSaleInfo(p);
          return (
            <li
              key={p.id}
              className={`overflow-hidden rounded-2xl border bg-zinc-900/60 ${
                sold ? "border-zinc-800 opacity-70" : "border-zinc-700"
              }`}
            >
              <div className="relative aspect-4/5 bg-zinc-800">
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width:640px) 45vw, 200px"
                    className={`object-cover ${sold ? "grayscale" : ""}`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-zinc-500">
                    Sin foto
                  </div>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                  {p.code}
                </span>
                {sold ? (
                  <span className="absolute bottom-2 left-2 rounded-md bg-red-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                    Vendida
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 px-2.5 py-2.5">
                {p.drop ? (
                  <p className="truncate text-[10px] font-medium uppercase tracking-wide text-amber-500/90">
                    {p.drop.name}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-600">Sin drop</p>
                )}
                <p className="text-[10px] text-zinc-600">
                  Prioridad catálogo: <span className="text-zinc-400">{p.sortOrder}</span>
                </p>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    title="Subir en el listado público"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await adjustProductSortAction(p.id, 5);
                      })
                    }
                    className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    title="Bajar en el listado"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await adjustProductSortAction(p.id, -5);
                      })
                    }
                    className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:border-zinc-500 disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    title="Enviar al tope del catálogo"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await pinProductFirstAction(p.id);
                      })
                    }
                    className="rounded-lg border border-amber-700/50 px-2 py-1 text-[11px] text-amber-200/90 hover:border-amber-500 disabled:opacity-40"
                  >
                    Tope
                  </button>
                  <Link
                    href={`/admin/productos/${p.id}`}
                    className="rounded-lg border border-amber-700/50 px-2 py-1 text-[11px] text-amber-200/90 hover:border-amber-500"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/p/${encodeURIComponent(p.code)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
                  >
                    Ficha
                  </Link>
                </div>
                <p className="line-clamp-2 text-xs font-medium text-white">
                  {p.title}
                </p>
                <p className="text-sm font-semibold text-amber-400">
                  {sale ? (
                    <>
                      <span className="text-rose-400">{formatCLP(sale.effectivePrice)}</span>
                      <span className="ml-1 text-[10px] text-zinc-500 line-through">
                        {formatCLP(p.price)}
                      </span>
                      <span className="ml-1 text-[10px] text-rose-400">-{sale.percent}%</span>
                    </>
                  ) : (
                    formatCLP(p.price)
                  )}
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] text-zinc-500">
                  {p.brand ? (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                      {p.brand}
                    </span>
                  ) : null}
                  {p.size ? (
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5">
                      {p.size}
                    </span>
                  ) : null}
                </div>
                {!sold ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await markSoldAction(p.id);
                      })
                    }
                    className="flex w-full items-center justify-center rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    Marcar vendida
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await markAvailableAction(p.id);
                      })
                    }
                    className="flex w-full items-center justify-center rounded-xl border border-zinc-600 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-400 disabled:opacity-50"
                  >
                    Deshacer (disponible)
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">
          No hay prendas con ese filtro.
        </p>
      ) : null}
    </div>
  );
}
