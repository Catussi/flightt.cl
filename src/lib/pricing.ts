import type { Product } from "@prisma/client";

export type SaleInfo = {
  percent: number;
  effectivePrice: number;
  endsAt: Date;
};

/** Descuento vigente según % y fecha de término. */
export function getSaleInfo(
  product: Pick<Product, "price" | "discountPercent" | "discountEndsAt">,
  now: Date = new Date(),
): SaleInfo | null {
  const percent = product.discountPercent;
  if (percent == null || percent <= 0) return null;

  const endsAt = product.discountEndsAt;
  if (!endsAt || endsAt <= now) return null;

  const effectivePrice = Math.max(0, Math.round(product.price * (1 - percent / 100)));
  if (effectivePrice >= product.price) return null;

  return { percent, effectivePrice, endsAt };
}

export function effectivePriceClp(
  product: Pick<Product, "price" | "discountPercent" | "discountEndsAt">,
  now?: Date,
): number {
  return getSaleInfo(product, now)?.effectivePrice ?? product.price;
}

export function isOnSale(
  product: Pick<Product, "price" | "discountPercent" | "discountEndsAt">,
  now?: Date,
): boolean {
  return getSaleInfo(product, now) != null;
}

export function formatSaleEndsAt(date: Date): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function parseDiscountPercent(raw: string | null | undefined): number | null {
  const t = raw?.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(90, Math.round(n));
}

/** `datetime-local` del formulario → Date UTC-local del navegador. */
export function parseDiscountEndsAt(raw: string | null | undefined): Date | null {
  const t = raw?.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
