import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { applyApprovedPayment } from "@/lib/payments/applyApprovedPayment";
import { buildPaymentBodyFromBrick } from "@/lib/payments/brickPaymentBody";
import {
  appBaseUrlFromRequest,
  mercadoPagoAccessToken,
} from "@/lib/payments/config";
import { storeName } from "@/lib/site";

function redirectForOrder(
  base: string,
  orderId: string,
  kind: "exito" | "error" | "pendiente" | "datos",
  mpDetail?: string,
) {
  if (kind === "exito") return `${base}/checkout/exito?ref=${encodeURIComponent(orderId)}`;
  if (kind === "datos") return `${base}/checkout/datos/${orderId}`;
  const url = `${base}/checkout/${kind}?ref=${encodeURIComponent(orderId)}`;
  if (mpDetail) return `${url}&mp=${encodeURIComponent(mpDetail)}`;
  return url;
}

export async function POST(request: NextRequest) {
  const token = mercadoPagoAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Pagos no configurados" }, { status: 503 });
  }

  let body: { orderId?: string; brickPayload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: "Falta orderId" }, { status: 400 });
  }

  if (body.brickPayload == null || typeof body.brickPayload !== "object") {
    return NextResponse.json({ error: "Falta brickPayload" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  if (order.status === "PAID") {
    return NextResponse.json(
      { error: "Esta orden ya está pagada" },
      { status: 409 },
    );
  }
  if (order.status === "CANCELLED") {
    return NextResponse.json({ error: "Esta orden fue cancelada" }, { status: 409 });
  }
  if (order.status === "FAILED") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PENDING", paymentId: null },
    });
    order.status = "PENDING";
  } else if (order.status !== "PENDING") {
    return NextResponse.json(
      { error: "Esta orden ya no está pendiente de pago" },
      { status: 409 },
    );
  }

  if (order.product.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Producto no disponible" }, { status: 409 });
  }

  const base = appBaseUrlFromRequest(request);

  if (order.fulfillmentStatus !== "COMPLETE") {
    return NextResponse.json(
      {
        error: "Completa retiro o envío antes de pagar.",
        redirect: redirectForOrder(base, order.id, "datos"),
      },
      { status: 400 },
    );
  }
  const notificationUrl = `${base}/api/webhooks/mercadopago`;
  const shop = storeName().slice(0, 22).replace(/[^\w\s.-]/g, "").trim() || "Tienda";

  let paymentBody;
  try {
    paymentBody = buildPaymentBodyFromBrick(
      order,
      body.brickPayload as Parameters<typeof buildPaymentBodyFromBrick>[1],
      notificationUrl,
      shop,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Datos de pago inválidos";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const client = new MercadoPagoConfig({ accessToken: token });
  const api = new Payment(client);

  let pay;
  try {
    pay = await api.create({ body: paymentBody });
  } catch (e: unknown) {
    console.error("MP create payment (brick):", e);
    let msg = "Mercado Pago rechazó la operación";
    if (e && typeof e === "object") {
      if ("message" in e && e.message) msg = String(e.message);
      if ("cause" in e && Array.isArray((e as { cause: unknown }).cause)) {
        const cause = (e as { cause: { description?: string }[] }).cause;
        const first = cause[0]?.description;
        if (first) msg = first;
      }
    }
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const paymentId = pay.id != null ? String(pay.id) : "";
  const status = pay.status ?? "";
  const amount = Number(pay.transaction_amount ?? order.amountClp);

  if (status === "approved" && paymentId) {
    await applyApprovedPayment(paymentId, order.id, amount);
    return NextResponse.json({
      redirect: redirectForOrder(base, order.id, "exito"),
    });
  }

  if (status === "pending" || status === "in_process") {
    if (paymentId) {
      await prisma.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { paymentId },
      });
    }
    return NextResponse.json({
      redirect: redirectForOrder(base, order.id, "pendiente"),
    });
  }

  if (paymentId) {
    await prisma.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "FAILED", paymentId },
    });
  }

  const detail = pay.status_detail ?? undefined;

  return NextResponse.json({
    redirect: redirectForOrder(base, order.id, "error", detail),
  });
}
