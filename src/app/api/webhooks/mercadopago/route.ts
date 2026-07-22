import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { applyApprovedPayment } from "@/lib/payments/applyApprovedPayment";
import { mercadoPagoAccessToken } from "@/lib/payments/config";

export async function GET() {
  return new Response("ok", { status: 200 });
}

function paymentIdFromRequest(request: NextRequest, rawBody: string): string | null {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic");
  const idParam = url.searchParams.get("id") ?? url.searchParams.get("data.id");
  if (topic === "payment" && idParam) return idParam;

  if (rawBody.length > 0) {
    try {
      const j = JSON.parse(rawBody) as {
        type?: string;
        topic?: string;
        data?: { id?: string | number };
        id?: string | number;
      };
      if (j?.data?.id != null) return String(j.data.id);
      if ((j?.type === "payment" || j?.topic === "payment") && j?.id != null) {
        return String(j.id);
      }
    } catch {
      const form = new URLSearchParams(rawBody);
      const fid = form.get("data.id") ?? form.get("id");
      const ftopic = form.get("topic") ?? form.get("type");
      if (fid && (ftopic === "payment" || !ftopic)) return fid;
    }
  }

  return null;
}

async function processPaymentNotification(paymentId: string) {
  const token = mercadoPagoAccessToken();
  if (!token) return;

  const client = new MercadoPagoConfig({ accessToken: token });
  const api = new Payment(client);

  let pay;
  try {
    pay = await api.get({ id: paymentId });
  } catch (e) {
    console.error("MP get payment:", e);
    return;
  }

  const ref = pay.external_reference ?? undefined;
  const amount = Number(pay.transaction_amount ?? 0);
  const status = pay.status ?? "";

  if (status === "approved") {
    await applyApprovedPayment(paymentId, ref, amount);
    return;
  }

  if (status === "pending" || status === "in_process") {
    if (ref) {
      await prisma.order.updateMany({
        where: { id: ref, status: "PENDING" },
        data: { paymentId },
      });
    }
    return;
  }

  if (status === "rejected" || status === "cancelled" || status === "refunded") {
    if (ref) {
      await prisma.order.updateMany({
        where: { id: ref, status: "PENDING" },
        data: { status: "FAILED", paymentId },
      });
    }
  }
}

export async function POST(request: NextRequest) {
  const token = mercadoPagoAccessToken();
  if (!token) {
    return NextResponse.json({ error: "ok" }, { status: 200 });
  }

  const rawBody = await request.text();
  const paymentId = paymentIdFromRequest(request, rawBody);

  if (paymentId) {
    await processPaymentNotification(paymentId);
  }

  return NextResponse.json({ ok: true });
}
