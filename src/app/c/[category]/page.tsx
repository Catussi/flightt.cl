import Link from "next/link";
import { notFound } from "next/navigation";
import { productListOrderBy } from "@/lib/catalogOrder";
import {
  CATEGORY_CONFIG,
  categoryFromSlug,
  categoryLabel,
} from "@/lib/catalog/categories";
import { isPaymentBrickConfigured } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { ProductCardPublic } from "@/components/ProductCardPublic";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Props = { params: Promise<{ category: string }> };

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const config = CATEGORY_CONFIG[category];

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
      where: { status: "AVAILABLE", category },
      include: { drop: true },
      orderBy: productListOrderBy,
    }),
  ]);

  const showOnlinePay = isPaymentBrickConfigured();

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <nav className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/"
            className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400 hover:border-zinc-500"
          >
            Todo
          </Link>
          <Link
            href="/ofertas"
            className="rounded-full border border-rose-800/60 px-3 py-1 text-rose-300/90 hover:border-zinc-500"
          >
            Ofertas
          </Link>
          {Object.values(CATEGORY_CONFIG).map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className={`rounded-full border px-3 py-1 ${
                c.slug === slug
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-200"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <header>
          <h1 className="text-xl font-semibold text-white">{config.label}</h1>
          <p className="mt-1 text-sm text-zinc-500">{config.description}</p>
        </header>

        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-500">
            No hay prendas disponibles en {categoryLabel(category).toLowerCase()} por ahora.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCardPublic key={p.id} product={p} showOnlinePay={showOnlinePay} />
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
