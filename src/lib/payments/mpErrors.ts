import { MercadoPagoConfig, Payment } from "mercadopago";
import { mercadoPagoAccessToken } from "@/lib/payments/config";

export const MP_CHILE_TEST_HINT = {
  card: "5416 7526 0258 2580",
  cvv: "123",
  expiry: "11/30",
  holder: "APRO",
  document: "123456789",
} as const;

const DETAIL_MESSAGES: Record<string, string> = {
  cc_rejected_other_reason:
    "Tarjeta rechazada. En prueba usa la Mastercard Chile 5416 7526 0258 2580, titular APRO y documento 123456789.",
  cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto.",
  cc_rejected_bad_filled_date: "Fecha de vencimiento incorrecta.",
  cc_rejected_bad_filled_security_code: "CVV incorrecto (usa 123).",
  cc_rejected_call_for_authorize: "Debes autorizar el pago con el banco.",
  cc_rejected_insufficient_amount: "Fondos insuficientes.",
  cc_rejected_high_risk: "Pago rechazado por riesgo.",
  rejected_by_bank: "Rechazado por el banco emisor.",
};

export function mpStatusDetailMessage(detail: string | null | undefined): string | null {
  if (!detail) return null;
  return DETAIL_MESSAGES[detail] ?? `Mercado Pago (${detail})`;
}

export async function fetchMercadoPagoPayment(paymentId: string) {
  const token = mercadoPagoAccessToken();
  if (!token) return null;
  try {
    const api = new Payment(new MercadoPagoConfig({ accessToken: token }));
    return await api.get({ id: paymentId });
  } catch (e) {
    console.error("MP get payment for error page:", e);
    return null;
  }
}
