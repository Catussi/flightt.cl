import { notFound } from "next/navigation";
import { productListOrderBy } from "@/lib/catalogOrder";
import { isPaymentBrickConfigured } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { DropHero } from "@/components/DropHero";
import { ProductCardPublic } from "@/components/ProductCardPublic";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Props = { params: Promise<{ slug: string }> };

export default async function DropPage({ params }: Props) {
  const { slug } = await params;

  const drop = await prisma.drop.findFirst({
    where: { slug, published: true },
  });

  if (!drop) notFound();

  const [publishedDrops, products, featuredDrop] = await Promise.all([
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.product.findMany({
      where: { status: "AVAILABLE", dropId: drop.id },
      include: { drop: true },
      orderBy: productListOrderBy,
    }),
    prisma.drop.findFirst({
      where: { featured: true, published: true },
    }),
  ]);

  const showOnlinePay = isPaymentBrickConfigured();

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-6">
        <DropHero drop={drop} showCatalogLink={false} emphasis="page" />

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-12 text-center text-sm text-zinc-500">
            No quedan prendas disponibles en este drop por ahora.
          </div>
        ) : (
          <section aria-labelledby={`drop-${drop.slug}-titulo`}>
            <h2 id={`drop-${drop.slug}-titulo`} className="text-sm font-semibold text-zinc-300">
              En este drop <span className="font-normal text-zinc-500">({products.length})</span>
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCardPublic key={p.id} product={p} showOnlinePay={showOnlinePay} />
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
