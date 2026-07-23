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

function normalizeIdNumber(raw: string): string {
  return raw.replace(/[.\-\s]/g, "");
}

function buildPayer(
  payerRaw: Record<string, unknown> | undefined,
): PaymentCreateRequest["payer"] {
  const email = payerRaw?.email;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new Error("Indica un correo válido en el formulario de pago");
  }

  const idRaw = payerRaw?.identification as
    | { type?: string; number?: string }
    | undefined;

  const payer: PaymentCreateRequest["payer"] = { email };

  if (idRaw?.number) {
    payer.identification = {
      type: idRaw.type?.trim() || "RUT",
      number: normalizeIdNumber(String(idRaw.number)),
    };
  }

  return payer;
}

function cardPaymentBody(
  base: PaymentCreateRequest,
  fd: BrickPayload["formData"],
  kind: string,
): PaymentCreateRequest {
  const token = fd?.token;
  if (!token || typeof token !== "string") {
    throw new Error("Falta token de tarjeta");
  }

  const paymentMethodId = fd?.payment_method_id;
  if (!paymentMethodId || typeof paymentMethodId !== "string") {
    throw new Error("Falta medio de pago");
  }

  const isDebit = kind.includes("debit") || paymentMethodId.includes("deb");
  const installments = isDebit ? 1 : Math.max(1, Number(fd?.installments ?? 1));

  const body: PaymentCreateRequest = {
    ...base,
    token,
    payment_method_id: paymentMethodId,
    installments,
    payer: buildPayer(fd?.payer as Record<string, unknown> | undefined),
  };

  if (fd?.issuer_id != null && fd.issuer_id !== "") {
    body.issuer_id = Number(fd.issuer_id);
  }

  return body;
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

  const base: PaymentCreateRequest = {
    external_reference: order.id,
    notification_url: notificationUrl,
    transaction_amount: order.amountClp,
    description: `${order.product.code} · ${order.product.title}`.slice(0, 200),
    statement_descriptor: statementDescriptor.slice(0, 22),
    metadata: { order_id: order.id, product_code: order.product.code },
  };

  if (
    kind === "creditcard" ||
    kind === "debitcard" ||
    kind === "credit_card" ||
    kind === "debit_card"
  ) {
    return cardPaymentBody(base, fd, kind);
  }

  if (
    kind === "ticket" ||
    kind === "bank_transfer" ||
    kind === "atm" ||
    kind === "banktransfer"
  ) {
    const payerRaw = fd.payer as Record<string, unknown> | undefined;
    if (!fd.payment_method_id) {
      throw new Error("Faltan datos del pagador para este medio");
    }
    const payer = buildPayer(payerRaw);
    return {
      ...base,
      payment_method_id: fd.payment_method_id as string,
      payer: {
        ...payer,
        first_name: String(payerRaw?.first_name ?? payerRaw?.firstName ?? "Cliente"),
        last_name: String(payerRaw?.last_name ?? payerRaw?.lastName ?? "Flightt"),
      },
    };
  }

  if (kind === "wallet_purchase" || kind === "onboarding_credits") {
    throw new Error("Este medio no está habilitado. Usa tarjeta de crédito o débito.");
  }

  if (fd.token && fd.payment_method_id) {
    return cardPaymentBody(base, fd, kind);
  }

  throw new Error(`Medio de pago no reconocido (${kind || "desconocido"})`);
}
