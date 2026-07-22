import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutCustomerAction } from "@/app/cuenta/actions";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  hasActiveLoyaltyReward,
  LOYALTY_DISCOUNT_PERCENT,
  LOYALTY_PURCHASES_NEEDED,
  LOYALTY_REWARD_DAYS,
} from "@/lib/loyalty";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { prisma } from "@/lib/prisma";

export default async function CuentaPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/cuenta/entrar");

  const [publishedDrops, featuredDrop, orders] = await Promise.all([
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.drop.findFirst({ where: { featured: true, published: true } }),
    prisma.order.findMany({
      where: { customerId: customer.id, status: "PAID" },
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const progress = customer.purchasesCount;
  const pct = Math.min(100, Math.round((progress / LOYALTY_PURCHASES_NEEDED) * 100));
  const reward = hasActiveLoyaltyReward(customer);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />
      <main className="mx-auto max-w-lg space-y-8 px-4 py-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Mi cuenta</h1>
          <p className="mt-1 text-sm text-zinc-500">{customer.email}</p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-amber-200">Juego de compras</h2>
          {reward ? (
            <div className="mt-3 rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-4 py-3">
              <p className="font-medium text-emerald-300">
                ¡Tienes {LOYALTY_DISCOUNT_PERCENT}% en tu próxima compra!
              </p>
              <p className="mt-1 text-xs text-emerald-200/80">
                Paga con esta sesión iniciada. Válido hasta{" "}
                {customer.loyaltyRewardExpiresAt
                  ? new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(
                      customer.loyaltyRewardExpiresAt,
                    )
                  : "—"}
                . No se combina con ofertas del catálogo.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-zinc-400">
                Compras confirmadas: <strong className="text-white">{progress}</strong> /{" "}
                {LOYALTY_PURCHASES_NEEDED}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Al llegar a {LOYALTY_PURCHASES_NEEDED} desbloqueas {LOYALTY_DISCOUNT_PERCENT}% por{" "}
                {LOYALTY_REWARD_DAYS} días (una sola compra).
              </p>
            </>
          )}
        </section>

        {orders.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-zinc-300">Tus compras</h2>
            <ul className="mt-3 space-y-2">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl border border-zinc-800 px-3 py-2 text-sm text-zinc-400"
                >
                  <span className="font-mono text-amber-400">{o.product.code}</span> —{" "}
                  {o.product.title}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
          >
            Ir al catálogo
          </Link>
          <form action={logoutCustomerAction}>
            <button
              type="submit"
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
            >
              Salir
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
