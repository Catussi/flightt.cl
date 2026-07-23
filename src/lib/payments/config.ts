import type { NextRequest } from "next/server";

/** Token servidor de Mercado Pago (nunca en NEXT_PUBLIC). */
export function mercadoPagoAccessToken(): string | undefined {
  return process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || undefined;
}

/** Clave pública para Bricks (Payment Brick en el navegador). */
export function mercadoPagoPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() || undefined;
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(mercadoPagoAccessToken());
}

/** Catálogo con botón de pago embebido (Bricks). */
export function isPaymentBrickConfigured(): boolean {
  return Boolean(mercadoPagoAccessToken() && mercadoPagoPublicKey());
}

/**
 * URL pública base (https en producción).
 * Preferir NEXT_PUBLIC_APP_URL; si no, cabeceras de la petición (Vercel, etc.).
 */
export function appBaseUrlFromRequest(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    request.headers.get("host") ??
    "";
  if (!host) return appBaseUrl();

  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  return `${proto}://${host}`;
}

export function appBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  return fromEnv || "http://localhost:3000";
}
