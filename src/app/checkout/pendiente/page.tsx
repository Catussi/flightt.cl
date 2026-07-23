import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckoutPendientePoller } from "@/components/checkout/CheckoutPendientePoller";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutPendientePage({ searchParams }: Props) {
  const { ref } = await searchParams;

  const order = ref
    ? await prisma.order.findUnique({ where: { id: ref } })
    : null;

  if (order?.status === "PAID") {
    if (order.fulfillmentStatus === "AWAITING_DETAILS") {
      redirect(`/checkout/datos/${order.id}`);
    }
    redirect(`/checkout/exito?ref=${encodeURIComponent(order.id)}`);
  }

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
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
          Pago pendiente
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Estamos esperando confirmación</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Algunos medios (ej. efectivo o transferencias) tardan un poco. Cuando Mercado Pago confirme,
          te llevaremos a la confirmación de compra.
        </p>
        {ref ? (
          <>
            <CheckoutPendientePoller orderId={ref} />
            <p className="mt-2 text-xs text-zinc-600">
              Referencia de orden: <span className="font-mono text-zinc-500">{ref}</span>
            </p>
          </>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {ref ? (
            <Link
              href={`/checkout/pendiente?ref=${encodeURIComponent(ref)}`}
              className="rounded-xl border border-zinc-600 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-400"
            >
              Recargar estado
            </Link>
          ) : null}
          <Link
            href="/"
            className="rounded-xl bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-white"
          >
            Ir al catálogo
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
