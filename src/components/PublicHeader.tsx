import Link from "next/link";
import type { Drop } from "@prisma/client";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { hasActiveLoyaltyReward } from "@/lib/loyalty";
import { storeName } from "@/lib/site";

export async function PublicHeader({
  featuredDrop,
  publishedDrops,
}: {
  featuredDrop: Drop | null;
  publishedDrops: Pick<Drop, "slug" | "name">[];
}) {
  const title = storeName();
  const customer = await getCurrentCustomer();
  const reward = customer ? hasActiveLoyaltyReward(customer) : false;

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
              Catálogo
            </p>
            <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={customer ? "/cuenta" : "/cuenta/entrar"}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                reward
                  ? "border-emerald-600/60 text-emerald-300"
                  : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {customer ? (reward ? "20% listo" : "Mi cuenta") : "Entrar"}
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
            >
              Admin
            </Link>
          </div>
        </div>
        {publishedDrops.length > 0 ? (
          <nav
            className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
            aria-label="Drops publicados"
          >
            <Link
              href="/"
              className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-200 hover:border-amber-500/50"
            >
              Todo
            </Link>
            {publishedDrops.map((d) => (
              <Link
                key={d.slug}
                href={`/d/${d.slug}`}
                className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                  featuredDrop?.slug === d.slug
                    ? "border border-amber-500/60 bg-amber-500/15 text-amber-200"
                    : "border border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-500"
                }`}
              >
                {d.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
