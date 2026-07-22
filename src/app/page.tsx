import Link from "next/link";
import { productListOrderBy } from "@/lib/catalogOrder";
import { CATEGORY_CONFIG, allCategories, categoryLabel } from "@/lib/catalog/categories";
import { isPaymentBrickConfigured } from "@/lib/payments/config";
import { isOnSale } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { DropHero } from "@/components/DropHero";
import { ProductCardPublic } from "@/components/ProductCardPublic";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ProductCategory } from "@prisma/client";

export default async function HomePage() {
  const [featuredDrop, publishedDrops, products] = await Promise.all([
    prisma.drop.findFirst({
      where: { featured: true, published: true },
    }),
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { status: "AVAILABLE" },
      include: { drop: true },
      orderBy: productListOrderBy,
    }),
  ]);

  const showOnlinePay = isPaymentBrickConfigured();
  const offers = products.filter((p) => isOnSale(p));

  const byCategory = allCategories().reduce(
    (acc, cat) => {
      acc[cat] = products.filter((p) => p.category === cat);
      return acc;
    },
    {} as Record<ProductCategory, typeof products>,
  );

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        {featuredDrop ? <DropHero drop={featuredDrop} /> : null}

        <nav className="flex flex-wrap gap-2 text-xs" aria-label="Categorías">
          <span className="rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-amber-200">
            Todo
          </span>
          <Link
            href="/ofertas"
            className="rounded-full border border-rose-800/60 px-3 py-1 text-rose-300/90 hover:border-rose-500/50"
          >
            Ofertas
          </Link>
          {Object.values(CATEGORY_CONFIG).map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400 hover:border-zinc-500"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {offers.length > 0 ? (
          <section aria-labelledby="ofertas-home">
            <div className="flex items-end justify-between gap-2">
              <h2 id="ofertas-home" className="text-sm font-semibold text-rose-300">
                Ofertas <span className="font-normal text-zinc-500">({offers.length})</span>
              </h2>
              <Link
                href="/ofertas"
                className="text-xs text-rose-400/90 hover:text-rose-300"
              >
                Ver todas →
              </Link>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {offers.slice(0, 4).map((p) => (
                <ProductCardPublic key={p.id} product={p} showOnlinePay={showOnlinePay} />
              ))}
            </ul>
          </section>
        ) : null}

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-16 text-center">
            <p className="text-zinc-400">Aún no hay prendas disponibles.</p>
            <p className="mt-2 text-sm text-zinc-500">
              Vuelve pronto: publicamos piezas nuevas cada semana.
            </p>
          </div>
        ) : (
          allCategories().map((cat) => {
            const list = byCategory[cat];
            if (list.length === 0) return null;
            const slug = CATEGORY_CONFIG[cat].slug;
            return (
              <section key={cat} aria-labelledby={`cat-${cat}`}>
                <div className="flex items-end justify-between gap-2">
                  <h2 id={`cat-${cat}`} className="text-sm font-semibold text-zinc-300">
                    {categoryLabel(cat)}{" "}
                    <span className="font-normal text-zinc-500">({list.length})</span>
                  </h2>
                  <Link
                    href={`/c/${slug}`}
                    className="text-xs text-amber-500/90 hover:text-amber-400"
                  >
                    Ver todo →
                  </Link>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {list.slice(0, 4).map((p) => (
                    <ProductCardPublic key={p.id} product={p} showOnlinePay={showOnlinePay} />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
