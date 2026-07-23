import type { Order, Product } from "@prisma/client";
import { isPickupTomorrow, pickupDayLabelEs } from "@/lib/pickupSchedule";
import { sendEmail } from "@/lib/notifications/email";
import { storeName } from "@/lib/site";
import { prisma } from "@/lib/prisma";

type OrderRow = Order & { product: Product };

function formatPickupDate(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

async function sendPickupReminder(order: OrderRow): Promise<void> {
  if (!order.buyerEmail || !order.pickupOn || !order.pickupDay) return;

  const shop = storeName();
  const day = pickupDayLabelEs(order.pickupDay);
  const when = formatPickupDate(order.pickupOn);

  const ok = await sendEmail({
    to: order.buyerEmail,
    subject: `Recordatorio retiro en feria · mañana ${day} · ${shop}`,
    html: `<p>Hola <strong>${order.buyerFirstName ?? ""}</strong>,</p>
<p>Te recordamos que <strong>mañana ${day}</strong> (${when}) retiras en feria tu compra:</p>
<ul>
<li><strong>${order.product.code}</strong> — ${order.product.title}</li>
</ul>
<p>Trae tu comprobante y el código de la prenda. Cualquier duda, escríbenos por Instagram o WhatsApp.</p>
<p>— ${shop}</p>`,
    text: `Mañana ${day} retiras en feria: ${order.product.code} — ${order.product.title}.`,
  });

  if (!ok) {
    throw new Error(`pickup reminder email failed for order ${order.id}`);
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { pickupReminderSentAt: new Date() },
  });
}

/** Envía recordatorios para retiros de feria que son mañana. */
export async function runPickupReminders(now: Date = new Date()): Promise<number> {
  const orders = await prisma.order.findMany({
    where: {
      status: "PAID",
      fulfillmentStatus: "COMPLETE",
      fulfillmentType: "PICKUP",
      pickupOn: { not: null },
      pickupReminderSentAt: null,
    },
    include: { product: true },
  });

  let sent = 0;
  for (const order of orders) {
    if (!order.pickupOn || !isPickupTomorrow(order.pickupOn, now)) continue;
    try {
      await sendPickupReminder(order);
      sent += 1;
    } catch (e) {
      console.error("pickup reminder", order.id, e);
    }
  }
  return sent;
}
