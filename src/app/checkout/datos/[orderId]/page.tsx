import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FulfillmentForm } from "@/components/checkout/FulfillmentForm";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/products";

type Props = { params: Promise<{ orderId: string }> };

export default async function CheckoutDatosPage({ params }: Props) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { include: { drop: true } } },
  });

  if (!order) notFound();

  if (order.status === "PAID" && order.fulfillmentStatus === "COMPLETE") {
    redirect(`/checkout/exito?ref=${encodeURIComponent(order.id)}`);
  }

  if (order.status !== "PENDING" && order.status !== "PAID") {
    redirect(`/checkout/pendiente?ref=${encodeURIComponent(order.id)}`);
  }

  const featuredDrop = await prisma.drop.findFirst({
    where: { featured: true, published: true },
  });
  const publishedDrops = await prisma.drop.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    select: { slug: true, name: true },
  });

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Paso 1 de 2
        </p>
        <h1 className="mt-1 text-xl font-semibold text-white">Entrega y resumen</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Elige retiro en feria o envío Chilexpress. Después verás el total y pagarás con
          Mercado Pago.
        </p>
        <p className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-300">
          <span className="font-medium text-white">{order.product.code}</span> ·{" "}
          {order.product.title} — {formatCLP(order.amountClp)}
        </p>
        {order.fulfillmentStatus === "COMPLETE" && order.status === "PENDING" ? (
          <p className="mt-3 rounded-xl border border-sky-900/40 bg-sky-950/20 px-3 py-2 text-xs text-sky-200">
            Ya tienes entrega definida. Puedes cambiarla o{" "}
            <Link href={`/checkout/pagar/${order.id}`} className="font-semibold underline">
              continuar al pago
            </Link>
            .
          </p>
        ) : null}
        {order.loyaltyDiscountApplied ? (
          <p className="mt-2 text-xs text-emerald-400">
            Incluye 20% de fidelidad en el precio.
          </p>
        ) : null}
        <div className="mt-6">
          <FulfillmentForm
            orderId={order.id}
            productLabel={`${order.product.code} · ${order.product.title} — ${formatCLP(order.amountClp)}`}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
