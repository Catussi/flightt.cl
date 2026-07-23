import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutExitoPage({ searchParams }: Props) {
  const { ref } = await searchParams;

  const [order, publishedDrops, featuredDrop] = await Promise.all([
    ref
      ? prisma.order.findUnique({
          where: { id: ref },
          include: { product: true },
        })
      : null,
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.drop.findFirst({
      where: { featured: true, published: true },
    }),
  ]);

  if (order?.status === "PAID" && order.fulfillmentStatus === "AWAITING_DETAILS") {
    redirect(`/checkout/datos/${order.id}`);
  }

  const pickupText =
    order?.fulfillmentType === "PICKUP"
      ? order.pickupDay === "THURSDAY"
        ? "jueves"
        : order.pickupDay === "SUNDAY"
          ? "domingo"
          : "feria"
      : null;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/90">
          Pago
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">¡Gracias!</h1>

        {order?.status === "PAID" && order.fulfillmentStatus === "COMPLETE" ? (
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            Tu compra de <strong className="text-zinc-200">{order.product.title}</strong> (
            <strong className="text-amber-400">{order.product.code}</strong>) quedó{" "}
            <strong className="text-emerald-400">confirmada</strong>.
            {order.fulfillmentType === "SHIPPING" ? (
              <> Coordinaremos tu envío por Chilexpress al correo que dejaste.</>
            ) : pickupText ? (
              <> Retiro en feria el <strong>{pickupText}</strong>. Te avisaremos por correo el día anterior.</>
            ) : null}
          </p>
        ) : order?.status === "PENDING" ? (
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            El pago puede tardar unos instantes en confirmarse. Recarga esta página en un minuto o
            revisa tu correo de Mercado Pago.
          </p>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            Si ya pagaste, la confirmación llegará en breve. Si ves un problema, escríbenos por
            Instagram o WhatsApp con tu comprobante.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Volver al catálogo
          </Link>
          {order?.product ? (
            <Link
              href={`/p/${encodeURIComponent(order.product.code)}`}
              className="rounded-xl border border-zinc-600 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-400"
            >
              Ver ficha
            </Link>
          ) : null}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
