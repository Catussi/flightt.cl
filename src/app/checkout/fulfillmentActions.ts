"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyOrderFulfillmentComplete } from "@/lib/notifications/orderEmails";
import { recordLoyaltyPurchase } from "@/lib/loyalty";
import { nextPickupOn } from "@/lib/pickupSchedule";
import { getCustomerId } from "@/lib/customerAuth";
import { quoteChilexpressShipping } from "@/lib/chilexpress/client";
import { isChilexpressConfigured } from "@/lib/chilexpress/config";
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

export type FulfillmentFormState = {
  error?: string;
};

export async function submitFulfillmentAction(
  _prev: FulfillmentFormState,
  formData: FormData,
): Promise<FulfillmentFormState> {
  const orderId = clean(formData.get("orderId"));
  if (!orderId) return { error: "Orden inválida" };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) return { error: "Orden no encontrada" };

  if (order.status !== "PENDING" && order.status !== "PAID") {
    return { error: "Esta orden ya no acepta cambios." };
  }

  if (order.fulfillmentStatus === "COMPLETE" && order.status === "PAID") {
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
  const buyerCountyCode = clean(formData.get("buyerCountyCode")).toUpperCase();

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
    if (!buyerAddress || !buyerCommune || !buyerRegion || !buyerCountyCode) {
      return { error: "Completa dirección y comuna válida para envío Chilexpress." };
    }
    if (!isChilexpressConfigured()) {
      return { error: "Cotización de envío no disponible por ahora." };
    }
  }

  const sessionCustomerId = await getCustomerId();
  const pickupOn =
    fulfillmentType === "PICKUP" && pickupDay ? nextPickupOn(pickupDay) : null;

  let shippingCostClp = 0;
  let shippingServiceName: string | null = null;
  let amountClp = order.productAmountClp;

  if (fulfillmentType === "SHIPPING") {
    try {
      const quote = await quoteChilexpressShipping({
        destinationCountyCode: buyerCountyCode,
        declaredWorthClp: order.productAmountClp,
      });
      shippingCostClp = quote.costClp;
      shippingServiceName = quote.serviceName;
      amountClp = order.productAmountClp + shippingCostClp;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "No se pudo cotizar el envío";
      return { error: msg };
    }
  }

  await prisma.order.update({
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
      buyerCountyCode: fulfillmentType === "SHIPPING" ? buyerCountyCode : null,
      shippingCostClp,
      shippingServiceName,
      amountClp,
      fulfillmentAt: new Date(),
      customerId: order.customerId ?? sessionCustomerId ?? null,
    },
  });

  revalidatePath("/admin/pedidos");

  if (order.status === "PENDING") {
    redirect(`/checkout/pagar/${orderId}`);
  }

  try {
    const updated = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });
    if (updated) {
      await notifyOrderFulfillmentComplete(updated);
      await recordLoyaltyPurchase(orderId);
    }
  } catch (e) {
    console.error("post-fulfillment:", e);
  }

  redirect(`/checkout/exito?ref=${encodeURIComponent(orderId)}`);
}
