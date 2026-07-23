import Link from "next/link";
import { sellerWhatsAppNotifyUrl } from "@/lib/notifications/sellerWhatsApp";
import { formatCLP } from "@/lib/products";
import type { FulfillmentStatus, FulfillmentType, Order, PickupDay, Product } from "@prisma/client";

type OrderRow = Order & { product: Product };

function fulfillmentBadge(type: FulfillmentType | null, day: PickupDay | null): string {
  if (type === "SHIPPING") return "Envío Chilexpress";
  if (type === "PICKUP") {
    if (day === "THURSDAY") return "Retiro jueves";
    if (day === "SUNDAY") return "Retiro domingo";
    return "Retiro feria";
  }
  return "—";
}

function statusBadge(status: FulfillmentStatus): string {
  if (status === "COMPLETE") return "Datos OK";
  return "Faltan datos";
}

export function AdminOrderList({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
        Aún no hay pedidos pagados.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((o) => {
        const wa = sellerWhatsAppNotifyUrl(o);
        return (
          <li
            key={o.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-amber-400">{o.product.code}</p>
                <p className="font-medium text-white">{o.product.title}</p>
                <p className="text-sm text-zinc-400">{formatCLP(o.amountClp)}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  o.fulfillmentStatus === "COMPLETE"
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-amber-950 text-amber-300"
                }`}
              >
                {statusBadge(o.fulfillmentStatus)}
              </span>
            </div>

            {o.fulfillmentStatus === "COMPLETE" ? (
              <dl className="mt-3 grid gap-1 text-xs text-zinc-400">
                <div>
                  <dt className="inline text-zinc-500">Cliente: </dt>
                  <dd className="inline text-zinc-300">
                    {o.buyerFirstName} {o.buyerLastName}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-zinc-500">Contacto: </dt>
                  <dd className="inline text-zinc-300">
                    {o.buyerEmail} · {o.buyerPhone}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-zinc-500">Entrega: </dt>
                  <dd className="inline text-zinc-300">
                    {fulfillmentBadge(o.fulfillmentType, o.pickupDay)}
                  </dd>
                </div>
                {o.fulfillmentType === "SHIPPING" ? (
                  <div>
                    <dt className="inline text-zinc-500">Dirección: </dt>
                    <dd className="inline text-zinc-300">
                      {o.buyerAddress}, {o.buyerCommune}, {o.buyerRegion}
                    </dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="mt-3 text-xs text-amber-400/90">
                El cliente aún no completó envío/retiro. Comparte el enlace de datos si hace falta.
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {o.fulfillmentStatus === "AWAITING_DETAILS" ? (
                <Link
                  href={`/checkout/datos/${o.id}`}
                  className="rounded-lg border border-zinc-700 px-2 py-1 text-[10px] text-zinc-300 hover:border-zinc-500"
                >
                  Abrir formulario datos
                </Link>
              ) : null}
              {wa ? (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-emerald-800/60 px-2 py-1 text-[10px] text-emerald-400 hover:border-emerald-600"
                >
                  WhatsApp resumen
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
