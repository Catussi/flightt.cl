import type { FulfillmentType, Order, PickupDay, Product } from "@prisma/client";
import { formatCLP } from "@/lib/products";
import { whatsappNumber } from "@/lib/site";

type OrderWithProduct = Order & { product: Product };

function pickupDayLabel(day: PickupDay | null | undefined): string {
  if (day === "THURSDAY") return "Jueves";
  if (day === "SUNDAY") return "Domingo";
  return "—";
}

function fulfillmentLabel(type: FulfillmentType | null | undefined): string {
  if (type === "SHIPPING") return "Envío Chilexpress";
  if (type === "PICKUP") return "Retiro feria";
  return "—";
}

/** URL wa.me al vendedor con resumen de la venta (para abrir desde email o admin). */
export function sellerWhatsAppNotifyUrl(order: OrderWithProduct): string | null {
  const phone = whatsappNumber();
  if (!phone) return null;

  const lines = [
    `Nueva venta ${order.product.code}`,
    order.product.title,
    formatCLP(order.amountClp),
    "",
    `${order.buyerFirstName} ${order.buyerLastName}`,
    order.buyerEmail ?? "",
    order.buyerPhone ?? "",
    fulfillmentLabel(order.fulfillmentType),
  ];

  if (order.fulfillmentType === "PICKUP") {
    lines.push(`Retiro: ${pickupDayLabel(order.pickupDay)}`);
  } else if (order.fulfillmentType === "SHIPPING") {
    lines.push(`${order.buyerAddress}, ${order.buyerCommune}, ${order.buyerRegion}`);
  }

  const text = lines.filter(Boolean).join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
