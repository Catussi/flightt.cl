import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PaymentBrickClient } from "@/components/checkout/PaymentBrickClient";
import { MpChileTestHint } from "@/components/checkout/MpChileTestHint";
import {
  isMercadoPagoTestMode,
  isPaymentBrickConfigured,
  mercadoPagoKeysMatchMode,
  mercadoPagoPublicKey,
} from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/products";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { storeName } from "@/lib/site";

type Props = { params: Promise<{ orderId: string }> };

export default async function CheckoutPagarPage({ params }: Props) {
  if (!isPaymentBrickConfigured()) {
    redirect("/");
  }

  const { orderId } = await params;
  const publicKey = mercadoPagoPublicKey()!;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: { include: { drop: true } } },
  });

  if (!order) notFound();

  if (order.status === "PAID") {
    redirect(`/checkout/exito?ref=${encodeURIComponent(order.id)}`);
  }
  if (order.status === "CANCELLED") {
    redirect(`/checkout/error?ref=${encodeURIComponent(order.id)}`);
  }

  if (order.status === "FAILED" && order.product.status === "AVAILABLE") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PENDING", paymentId: null },
    });
    order.status = "PENDING";
  } else if (order.status === "FAILED") {
    redirect(`/checkout/error?ref=${encodeURIComponent(order.id)}`);
  }

  if (order.product.status !== "AVAILABLE") {
    return (
      <div className="min-h-full bg-zinc-950 text-zinc-100">
        <PublicHeader featuredDrop={null} publishedDrops={[]} />
        <main className="mx-auto max-w-lg space-y-4 px-4 py-10 text-center">
          <h1 className="text-lg font-semibold text-white">Ya no está disponible</h1>
          <p className="text-sm text-zinc-400">
            Esta prenda fue vendida o retirada del catálogo antes de completar el pago.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
          >
            Volver al catálogo
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const featuredDrop = await prisma.drop.findFirst({
    where: { featured: true, published: true },
  });
  const publishedDrops = await prisma.drop.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
    select: { slug: true, name: true },
  });

  const shop = storeName();
  const productLabel = `${order.product.code} · ${order.product.title} — ${formatCLP(order.amountClp)}`;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />
      <main className="mx-auto max-w-lg px-4 py-8">
        <h1 className="text-xl font-semibold text-white">Pagar en {shop}</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Completa el pago con Mercado Pago. No compartas esta página.
        </p>
        {order.loyaltyDiscountApplied ? (
          <p className="mt-3 rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-200">
            Se aplicó tu <strong>20% de fidelidad</strong> en esta compra.
          </p>
        ) : null}
        {isMercadoPagoTestMode() ? (
          <div className="mt-4">
            <MpChileTestHint />
          </div>
        ) : null}
        {!mercadoPagoKeysMatchMode() ? (
          <p className="mt-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-xs text-red-200">
            Las credenciales de Mercado Pago no coinciden: usa ambas de prueba (TEST) o ambas
            de producción en Vercel.
          </p>
        ) : null}
        <div className="mt-8">
          <PaymentBrickClient
            publicKey={publicKey}
            orderId={order.id}
            amount={order.amountClp}
            productLabel={productLabel}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
