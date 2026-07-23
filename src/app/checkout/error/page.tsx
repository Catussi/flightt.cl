import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isMercadoPagoTestMode } from "@/lib/payments/config";
import { PublicHeader } from "@/components/PublicHeader";import { SiteFooter } from "@/components/SiteFooter";
import { CheckoutPendientePoller } from "@/components/checkout/CheckoutPendientePoller";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutErrorPage({ searchParams }: Props) {
  const { ref } = await searchParams;

  const order = ref
    ? await prisma.order.findUnique({
        where: { id: ref },
        include: { product: true },
      })
    : null;

  const canRetry =
    order &&
    order.product.status === "AVAILABLE" &&
    (order.status === "PENDING" || order.status === "FAILED");

  const showTestHint = isMercadoPagoTestMode();
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
          {order?.product.status !== "AVAILABLE"
            ? "Esta prenda ya no está disponible. Elige otra del catálogo."
            : "Puedes intentar de nuevo o escribirnos por WhatsApp."}
        </p>
        {showTestHint && order?.product?.status === "AVAILABLE" ? (
          <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-left text-xs text-zinc-500">
            <strong className="text-zinc-400">Prueba en modo test:</strong> tarjeta{" "}
            <span className="font-mono text-zinc-400">5031 7557 3453 0604</span>, titular{" "}
            <span className="font-mono text-zinc-400">APRO</span>, CVV <span className="font-mono">123</span>,
            vencimiento futuro.
          </p>
        ) : null}
        {order?.product ? (
          <p className="mt-2 text-sm text-zinc-500">
            {order.product.code} — {order.product.title}
          </p>
        ) : null}
        {ref ? (
          <p className="mt-2 text-xs text-zinc-600">
            Referencia: <span className="font-mono text-zinc-500">{ref}</span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {canRetry ? (
            <Link
              href={`/checkout/pagar/${order.id}`}
              className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-400"
            >
              Reintentar pago
            </Link>
          ) : null}
          {order?.product ? (
            <Link
              href={`/p/${encodeURIComponent(order.product.code)}`}
              className="rounded-xl border border-zinc-600 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-400"
            >
              Ver prenda
            </Link>
          ) : null}
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
