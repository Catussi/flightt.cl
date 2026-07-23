import type { FulfillmentType, Order, PickupDay, Product } from "@prisma/client";
import { formatCLP } from "@/lib/products";
import { appBaseUrl } from "@/lib/payments/config";
import { storeName } from "@/lib/site";
import { sellerWhatsAppNotifyUrl } from "@/lib/notifications/sellerWhatsApp";
import { sendEmail, sellerEmail } from "@/lib/notifications/email";

type OrderWithProduct = Order & { product: Product };

function pickupDayLabel(day: PickupDay | null | undefined): string {
  if (day === "THURSDAY") return "Jueves";
  if (day === "SUNDAY") return "Domingo";
  return "—";
}

function fulfillmentLabel(type: FulfillmentType | null | undefined): string {
  if (type === "SHIPPING") return "Envío Chilexpress";
  if (type === "PICKUP") return "Retiro en feria";
  return "—";
}

function buyerHtml(order: OrderWithProduct): string {
  const shop = storeName();
  const isShipping = order.fulfillmentType === "SHIPPING";
  const lines = [
    `<p>Hola <strong>${order.buyerFirstName}</strong>,</p>`,
    `<p>Tu compra en <strong>${shop}</strong> quedó confirmada:</p>`,
    `<ul>`,
    `<li><strong>${order.product.code}</strong> — ${order.product.title}</li>`,
    `<li>Total pagado: ${formatCLP(order.amountClp)}</li>`,
    `<li>Entrega: ${fulfillmentLabel(order.fulfillmentType)}</li>`,
  ];
  if (order.fulfillmentType === "PICKUP") {
    lines.push(`<li>Retiro: <strong>${pickupDayLabel(order.pickupDay)}</strong></li>`);
    lines.push(
      `<li>Te enviaremos un recordatorio por correo el día anterior al retiro.</li>`,
    );
  }
  if (isShipping) {
    lines.push(`<li>Envío por Chilexpress — incluido en el total pagado.</li>`);
    lines.push(`<li>Dirección: ${order.buyerAddress}, ${order.buyerCommune}, ${order.buyerRegion}</li>`);
  }
  lines.push(`</ul><p>Gracias por comprar en ${shop}.</p>`);
  return lines.join("\n");
}

function sellerHtml(order: OrderWithProduct, waUrl: string | null): string {
  const lines = [
    `<p><strong>Nueva venta</strong> — ${order.product.code}</p>`,
    `<ul>`,
    `<li>${order.product.title} · ${formatCLP(order.amountClp)}</li>`,
    `<li>Cliente: ${order.buyerFirstName} ${order.buyerLastName}</li>`,
    `<li>Email: ${order.buyerEmail}</li>`,
    `<li>Tel: ${order.buyerPhone}</li>`,
    `<li>${fulfillmentLabel(order.fulfillmentType)}</li>`,
  ];
  if (order.fulfillmentType === "PICKUP") {
    lines.push(`<li>Retiro: ${pickupDayLabel(order.pickupDay)}</li>`);
  } else if (order.fulfillmentType === "SHIPPING") {
    lines.push(
      `<li>Dirección: ${order.buyerAddress}, ${order.buyerCommune}, ${order.buyerRegion}</li>`,
    );
  }
  lines.push(`</ul>`);
  if (waUrl) {
    lines.push(`<p><a href="${waUrl}">Abrir resumen en WhatsApp</a></p>`);
  }
  return lines.join("\n");
}

export async function notifyOrderFulfillmentComplete(order: OrderWithProduct): Promise<void> {
  const shop = storeName();
  const waUrl = sellerWhatsAppNotifyUrl(order);

  if (order.buyerEmail) {
    const sent = await sendEmail({
      to: order.buyerEmail,
      subject: `Compra confirmada · ${order.product.code} · ${shop}`,
      html: buyerHtml(order),
      text: `Compra confirmada: ${order.product.code} — ${order.product.title}. ${fulfillmentLabel(order.fulfillmentType)}.`,
    });
    if (!sent) console.error("[email] buyer fulfillment failed", order.id);
  }

  const toSeller = sellerEmail();
  if (toSeller) {
    const sent = await sendEmail({
      to: toSeller,
      subject: `Nueva venta ${order.product.code} · ${shop}`,
      html: sellerHtml(order, waUrl),
      text: `Nueva venta ${order.product.code}. ${order.buyerFirstName} ${order.buyerLastName}.`,
    });
    if (!sent) console.error("[email] seller fulfillment failed", order.id);
  }
}

export async function notifyOrderPaymentApproved(order: OrderWithProduct): Promise<void> {
  const shop = storeName();
  const base = appBaseUrl();
  const toSeller = sellerEmail();

  if (!toSeller) return;

  const sent = await sendEmail({
    to: toSeller,
    subject: `Pago recibido · ${order.product.code} · ${shop}`,
    html: `<p>Se aprobó un pago en <strong>${shop}</strong>:</p>
<ul>
<li><strong>${order.product.code}</strong> — ${order.product.title}</li>
<li>Monto: ${formatCLP(order.amountClp)}</li>
</ul>
<p>El cliente completará envío o retiro en <a href="${base}/checkout/datos/${order.id}">este formulario</a>.</p>
<p><a href="${base}/admin/pedidos">Ver pedidos en admin</a></p>`,
    text: `Pago recibido: ${order.product.code} — ${formatCLP(order.amountClp)}.`,
  });
  if (!sent) console.error("[email] seller payment failed", order.id);
}
