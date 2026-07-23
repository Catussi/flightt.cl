import { NextRequest, NextResponse } from "next/server";
import { getCustomerId } from "@/lib/customerAuth";
import { checkoutAmountForProduct } from "@/lib/loyalty";
import { prisma } from "@/lib/prisma";
import { isPaymentBrickConfigured } from "@/lib/payments/config";

export async function POST(request: NextRequest) {
  if (!isPaymentBrickConfigured()) {
    return NextResponse.json({ error: "Pagos no configurados" }, { status: 503 });
  }

  let body: { productId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const productId = body.productId?.trim();
  if (!productId) {
    return NextResponse.json({ error: "Falta productId" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  }

  const customerId = await getCustomerId();
  const customer = customerId
    ? await prisma.customer.findUnique({ where: { id: customerId } })
    : null;

  const { amountClp, loyaltyApplied } = checkoutAmountForProduct(product, customer);

  const order = await prisma.order.create({
    data: {
      productId: product.id,
      customerId: customer?.id ?? null,
      productAmountClp: amountClp,
      amountClp,
      loyaltyDiscountApplied: loyaltyApplied,
    },
  });

  return NextResponse.json({ orderId: order.id });
}
