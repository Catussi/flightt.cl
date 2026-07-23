import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { consumeLoyaltyRewardIfUsed } from "@/lib/loyalty";
import { notifyOrderPaymentApproved } from "@/lib/notifications/orderEmails";
import { revalidateProductViews } from "@/lib/revalidateCatalog";

/** Marca orden PAID y producto SOLD si corresponde. Idempotente si ya no está PENDING. */
export async function applyApprovedPayment(
  paymentId: string,
  externalRef: string | undefined,
  amount: number,
): Promise<void> {
  if (!externalRef) return;

  const order = await prisma.order.findUnique({
    where: { id: externalRef },
    include: { product: true },
  });
  if (!order) return;

  if (Math.round(amount) !== order.amountClp) {
    console.warn(`MP amount mismatch order ${order.id}: ${amount} vs ${order.amountClp}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id: externalRef } });
    if (!o || o.status !== "PENDING") return;

    const p = await tx.product.findUnique({ where: { id: o.productId } });
    if (!p || p.status !== "AVAILABLE") {
      await tx.order.update({
        where: { id: externalRef },
        data: { status: "FAILED", paymentId },
      });
      return;
    }

    await tx.order.update({
      where: { id: externalRef },
      data: { status: "PAID", paymentId },
    });
    await tx.product.update({
      where: { id: o.productId },
      data: { status: "SOLD", soldAt: new Date() },
    });
  });

  const done = await prisma.order.findUnique({
    where: { id: externalRef },
    include: { product: { include: { drop: { select: { slug: true } } } } },
  });

  if (done?.status === "PAID" && done.product) {
    await consumeLoyaltyRewardIfUsed(externalRef);
    try {
      await notifyOrderPaymentApproved(done);
    } catch (e) {
      console.error("[email] payment approved notify", externalRef, e);
    }
    revalidateProductViews(done.product.code, done.product.drop?.slug);
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/drops");
    revalidatePath("/admin/pedidos");
  }
}
