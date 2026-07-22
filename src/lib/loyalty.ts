import type { Customer, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications/email";
import { effectivePriceClp } from "@/lib/pricing";
import { storeName } from "@/lib/site";

export const LOYALTY_PURCHASES_NEEDED = 5;
export const LOYALTY_DISCOUNT_PERCENT = 20;
export const LOYALTY_REWARD_DAYS = 30;

export function hasActiveLoyaltyReward(
  customer: Pick<Customer, "loyaltyRewardAvailable" | "loyaltyRewardExpiresAt">,
  now: Date = new Date(),
): boolean {
  return (
    customer.loyaltyRewardAvailable &&
    customer.loyaltyRewardExpiresAt != null &&
    customer.loyaltyRewardExpiresAt > now
  );
}

export function checkoutAmountForProduct(
  product: Product,
  customer: Customer | null,
  now?: Date,
): { amountClp: number; loyaltyApplied: boolean } {
  if (customer && hasActiveLoyaltyReward(customer, now)) {
    const amountClp = Math.round(
      product.price * (1 - LOYALTY_DISCOUNT_PERCENT / 100),
    );
    return { amountClp, loyaltyApplied: true };
  }
  return { amountClp: effectivePriceClp(product, now), loyaltyApplied: false };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function consumeLoyaltyRewardIfUsed(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.loyaltyDiscountApplied || !order.customerId) return;

  await prisma.customer.update({
    where: { id: order.customerId },
    data: {
      loyaltyRewardAvailable: false,
      loyaltyRewardExpiresAt: null,
    },
  });
}

export async function recordLoyaltyPurchase(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (
    !order ||
    order.loyaltyCounted ||
    order.status !== "PAID" ||
    order.fulfillmentStatus !== "COMPLETE"
  ) {
    return;
  }

  let customerId = order.customerId;
  if (!customerId && order.buyerEmail) {
    const byEmail = await prisma.customer.findUnique({
      where: { email: order.buyerEmail.trim().toLowerCase() },
    });
    if (byEmail) customerId = byEmail.id;
  }
  if (!customerId) return;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return;

  const newCount = customer.purchasesCount + 1;
  const grantReward = newCount >= LOYALTY_PURCHASES_NEEDED;
  const expiresAt = grantReward ? addDays(new Date(), LOYALTY_REWARD_DAYS) : null;

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: {
        purchasesCount: grantReward ? 0 : newCount,
        loyaltyRewardAvailable: grantReward ? true : customer.loyaltyRewardAvailable,
        loyaltyRewardExpiresAt: grantReward
          ? expiresAt
          : customer.loyaltyRewardExpiresAt,
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { loyaltyCounted: true, customerId },
    }),
  ]);

  if (grantReward && customer.email) {
    const shop = storeName();
    await sendEmail({
      to: customer.email,
      subject: `¡Desbloqueaste 20% en ${shop}!`,
      html: `<p>¡Llegaste a <strong>${LOYALTY_PURCHASES_NEEDED} compras</strong> en ${shop}!</p>
<p>Tu próxima compra tiene <strong>${LOYALTY_DISCOUNT_PERCENT}% de descuento</strong> (no se combina con otras ofertas).</p>
<p>Tienes <strong>${LOYALTY_REWARD_DAYS} días</strong> para usarlo. Entra a tu cuenta y compra con la sesión iniciada.</p>`,
      text: `Desbloqueaste 20% en tu próxima compra en ${shop}. Válido ${LOYALTY_REWARD_DAYS} días.`,
    });
  }
}
