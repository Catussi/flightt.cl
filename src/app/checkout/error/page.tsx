import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutErrorPage({ searchParams }: Props) {
  const { ref } = await searchParams;

  const [publishedDrops, featuredDrop] = await Promise.all([
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.drop.findFirst({
      where: { featured: true, published: true },
    }),
  ]);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-red-400/90">
          Pago
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">No se completó el pago</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Podés intentar de nuevo desde la ficha del producto o escribirnos por WhatsApp.
        </p>
        {ref ? (
          <p className="mt-2 text-xs text-zinc-600">
            Referencia: <span className="font-mono text-zinc-500">{ref}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Catálogo
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
