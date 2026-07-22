"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyOrderFulfillmentComplete } from "@/lib/notifications/orderEmails";
import { recordLoyaltyPurchase } from "@/lib/loyalty";
import { nextPickupOn } from "@/lib/pickupSchedule";
import { getCustomerId } from "@/lib/customerAuth";
import type { FulfillmentType, PickupDay } from "@prisma/client";

function clean(s: FormDataEntryValue | null): string {
  return s?.toString().trim() ?? "";
}

function parseFulfillmentType(raw: string): FulfillmentType | null {
  if (raw === "SHIPPING" || raw === "PICKUP") return raw;
  return null;
}

function parsePickupDay(raw: string): PickupDay | null {
  if (raw === "THURSDAY" || raw === "SUNDAY") return raw;
  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitFulfillmentAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const orderId = clean(formData.get("orderId"));
  if (!orderId) return { error: "Orden inválida" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) return { error: "Orden no encontrada" };
  if (order.status !== "PAID") {
    return { error: "Esta orden aún no está pagada" };
  }
  if (order.fulfillmentStatus === "COMPLETE") {
    redirect(`/checkout/exito?ref=${encodeURIComponent(orderId)}`);
  }

  const fulfillmentType = parseFulfillmentType(clean(formData.get("fulfillmentType")));
  const pickupDay = parsePickupDay(clean(formData.get("pickupDay")));
  const buyerFirstName = clean(formData.get("buyerFirstName"));
  const buyerLastName = clean(formData.get("buyerLastName"));
  const buyerEmail = clean(formData.get("buyerEmail"));
  const buyerPhone = clean(formData.get("buyerPhone")).replace(/\s/g, "");
  const buyerAddress = clean(formData.get("buyerAddress"));
  const buyerCommune = clean(formData.get("buyerCommune"));
  const buyerRegion = clean(formData.get("buyerRegion"));

  if (!fulfillmentType) return { error: "Elige envío o retiro en feria" };
  if (!buyerFirstName || !buyerLastName) {
    return { error: "Nombre y apellidos son obligatorios" };
  }
  if (!buyerEmail || !isValidEmail(buyerEmail)) {
    return { error: "Correo válido obligatorio" };
  }
  if (!buyerPhone || buyerPhone.length < 8) {
    return { error: "Teléfono válido obligatorio" };
  }

  if (fulfillmentType === "PICKUP") {
    if (!pickupDay) return { error: "Elige día de retiro: jueves o domingo" };
  }

  if (fulfillmentType === "SHIPPING") {
    if (!buyerAddress || !buyerCommune || !buyerRegion) {
      return { error: "Dirección, comuna y región son obligatorias para envío" };
    }
  }

  const sessionCustomerId = await getCustomerId();
  const pickupOn =
    fulfillmentType === "PICKUP" && pickupDay ? nextPickupOn(pickupDay) : null;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      fulfillmentStatus: "COMPLETE",
      fulfillmentType,
      pickupDay: fulfillmentType === "PICKUP" ? pickupDay : null,
      pickupOn,
      buyerFirstName,
      buyerLastName,
      buyerEmail,
      buyerPhone,
      buyerAddress: fulfillmentType === "SHIPPING" ? buyerAddress : null,
      buyerCommune: fulfillmentType === "SHIPPING" ? buyerCommune : null,
      buyerRegion: fulfillmentType === "SHIPPING" ? buyerRegion : null,
      fulfillmentAt: new Date(),
      customerId: order.customerId ?? sessionCustomerId ?? null,
    },
    include: { product: true },
  });

  try {
    await notifyOrderFulfillmentComplete(updated);
    await recordLoyaltyPurchase(orderId);
  } catch (e) {
    console.error("post-fulfillment:", e);
  }

  revalidatePath("/admin/pedidos");
  redirect(`/checkout/exito?ref=${encodeURIComponent(orderId)}`);
}
