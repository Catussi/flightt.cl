import type { Order, Product } from "@prisma/client";
import { formatCLP } from "@/lib/products";
import { pickupDayLabelEs } from "@/lib/pickupSchedule";

type OrderWithProduct = Order & { product: Product };

export function CheckoutOrderSummary({ order }: { order: OrderWithProduct }) {
  const isPickup = order.fulfillmentType === "PICKUP";
  const pickupLabel =
    order.pickupDay != null ? pickupDayLabelEs(order.pickupDay) : null;
  const hasShipping = !isPickup && order.shippingCostClp > 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Resumen
      </h2>
      <dl className="mt-3 space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-400">
            {order.product.code} · {order.product.title}
          </dt>
          <dd className="shrink-0 font-medium text-white">
            {formatCLP(order.productAmountClp)}
          </dd>
        </div>
        {hasShipping ? (
          <div className="flex justify-between gap-4 text-xs">
            <dt className="text-zinc-500">
              Envío Chilexpress
              {order.shippingServiceName ? ` · ${order.shippingServiceName}` : ""}
            </dt>
            <dd className="text-zinc-300">{formatCLP(order.shippingCostClp)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 text-xs">
          <dt className="text-zinc-500">Entrega</dt>
          <dd className="text-right text-zinc-300">
            {isPickup ? (
              <>Retiro feria{pickupLabel ? ` · ${pickupLabel}` : ""} · sin costo</>
            ) : (
              <>Despacho a domicilio por Chilexpress</>
            )}
          </dd>
        </div>
        {!isPickup && order.buyerCommune ? (
          <div className="text-xs text-zinc-500">
            {order.buyerAddress}, {order.buyerCommune}, {order.buyerRegion}
          </div>
        ) : null}
        <div className="border-t border-zinc-800 pt-3 flex justify-between gap-4">
          <dt className="font-semibold text-zinc-200">Total a pagar ahora</dt>
          <dd className="text-lg font-bold text-amber-400">
            {formatCLP(order.amountClp)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
