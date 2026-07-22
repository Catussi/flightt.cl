import type { PaymentCreateRequest } from "mercadopago/dist/clients/payment/create/types";
import type { Product, Order } from "@prisma/client";

type BrickPayload = {
  paymentType?: string;
  selectedPaymentMethod?: string;
  formData?: Record<string, unknown> & {
    token?: string;
    issuer_id?: string | number;
    payment_method_id?: string;
    installments?: number | string;
    transaction_amount?: number;
    payer?: Record<string, unknown>;
  };
};

function pickPaymentKind(payload: BrickPayload): string {
  return (
    payload.paymentType ??
    payload.selectedPaymentMethod ??
    ""
  ).toLowerCase();
}

/** Arma el body de POST /v1/payments a partir del callback del Payment Brick. */
export function buildPaymentBodyFromBrick(
  order: Order & { product: Product },
  payload: BrickPayload,
  notificationUrl: string,
  statementDescriptor: string,
): PaymentCreateRequest {
  const fd = payload.formData ?? {};
  const kind = pickPaymentKind(payload);

  const base = {
    external_reference: order.id,
    notification_url: notificationUrl,
    transaction_amount: order.amountClp,
    description: `${order.product.code} · ${order.product.title}`.slice(0, 200),
    statement_descriptor: statementDescriptor.slice(0, 22),
    metadata: { order_id: order.id, product_code: order.product.code },
  };

  if (kind === "creditcard" || kind === "debitcard" || kind === "credit_card" || kind === "debit_card") {
    const token = fd.token;
    if (!token || typeof token !== "string") {
      throw new Error("Falta token de tarjeta");
    }
    const payer = fd.payer as
      | { email?: string; identification?: { type?: string; number?: string } }
      | undefined;
    return {
      ...base,
      token,
      issuer_id: fd.issuer_id != null && fd.issuer_id !== "" ? Number(fd.issuer_id) : undefined,
      payment_method_id: fd.payment_method_id as string,
      installments: Math.max(1, Number(fd.installments ?? 1)),
      payer: {
        email: payer?.email,
        identification: payer?.identification
          ? {
              type: payer.identification.type ?? "RUT",
              number: String(payer.identification.number ?? ""),
            }
          : undefined,
      },
    };
  }

  if (
    kind === "ticket" ||
    kind === "bank_transfer" ||
    kind === "atm" ||
    kind === "banktransfer"
  ) {
    const payerRaw = fd.payer as Record<string, unknown> | undefined;
    if (!payerRaw?.email || !fd.payment_method_id) {
      throw new Error("Faltan datos del pagador para este medio");
    }
    return {
      ...base,
      payment_method_id: fd.payment_method_id as string,
      payer: {
        email: String(payerRaw.email),
        identification: payerRaw.identification as { type: string; number: string },
        first_name: String(payerRaw.first_name ?? payerRaw.firstName ?? ""),
        last_name: String(payerRaw.last_name ?? payerRaw.lastName ?? ""),
      },
    };
  }

  if (kind === "wallet_purchase" || kind === "onboarding_credits") {
    throw new Error(
      "Saldo Mercado Pago / créditos requieren preferencia aparte. Usa tarjeta, débito o medios offline del brick.",
    );
  }

  if (fd.token && fd.payment_method_id) {
    const payer = fd.payer as
      | { email?: string; identification?: { type?: string; number?: string } }
      | undefined;
    return {
      ...base,
      token: fd.token as string,
      issuer_id: fd.issuer_id != null && fd.issuer_id !== "" ? Number(fd.issuer_id) : undefined,
      payment_method_id: fd.payment_method_id as string,
      installments: Math.max(1, Number(fd.installments ?? 1)),
      payer: {
        email: payer?.email,
        identification: payer?.identification
          ? {
              type: payer.identification.type ?? "RUT",
              number: String(payer.identification.number ?? ""),
            }
          : undefined,
      },
    };
  }

  throw new Error(`Medio de pago no reconocido (${kind || "desconocido"})`);
}
