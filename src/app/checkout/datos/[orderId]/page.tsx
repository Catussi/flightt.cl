import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FulfillmentForm } from "@/components/checkout/FulfillmentForm";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";
import { formatCLP } from "@/lib/products";
import { storeName } from "@/lib/site";

type Props = { params: Promise<{ orderId: string }> };

export default async function CheckoutDatosPage({ params }: Props) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) notFound();

  if (order.status !== "PAID") {
    redirect(`/checkout/pendiente?ref=${encodeURIComponent(orderId)}`);
  }

  if (order.fulfillmentStatus === "COMPLETE") {
    redirect(`/checkout/exito?ref=${encodeURIComponent(orderId)}`);
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

  const shop = storeName();
  const productLabel = `${order.product.code} · ${order.product.title} — ${formatCLP(order.amountClp)}`;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />
      <main className="mx-auto max-w-lg px-4 py-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/90">
          Paso 2
        </p>
        <h1 className="mt-2 text-xl font-semibold text-white">Datos de entrega</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Tu pago en {shop} fue recibido. Completa estos datos para coordinar envío o retiro en
          feria.
        </p>
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
          <FulfillmentForm orderId={order.id} productLabel={productLabel} />
        </div>
        <p className="mt-6 text-center text-xs text-zinc-600">
          ¿Problemas?{" "}
          <Link href="/" className="text-zinc-400 underline hover:text-zinc-300">
            Volver al catálogo
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
