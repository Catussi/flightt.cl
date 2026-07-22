import Link from "next/link";
import { productListOrderBy } from "@/lib/catalogOrder";
import { isPaymentBrickConfigured } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { isOnSale } from "@/lib/pricing";
import { ProductCardPublic } from "@/components/ProductCardPublic";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default async function OfertasPage() {
  const now = new Date();

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
      where: {
        status: "AVAILABLE",
        discountPercent: { gt: 0 },
        discountEndsAt: { gt: now },
      },
      include: { drop: true },
      orderBy: productListOrderBy,
    }),
  ]);

  const showOnlinePay = isPaymentBrickConfigured();
  const onSale = products.filter((p) => isOnSale(p, now));

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-400/90">
            Sale
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Ofertas</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Descuentos por tiempo limitado. El precio en checkout es el de la oferta.
          </p>
        </header>

        <nav className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/"
            className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-400 hover:border-zinc-500"
          >
            Catálogo
          </Link>
          <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-3 py-1 text-rose-200">
            Ofertas
          </span>
        </nav>

        {onSale.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-800 px-6 py-14 text-center text-sm text-zinc-500">
            No hay ofertas activas ahora. Vuelve pronto o mira el catálogo completo.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {onSale.map((p) => (
              <ProductCardPublic key={p.id} product={p} showOnlinePay={showOnlinePay} />
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
