import type { Product } from "@prisma/client";

export function parseImages(product: Product): string[] {
  try {
    const parsed = JSON.parse(product.images) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function primaryImage(product: Product): string | null {
  const imgs = parseImages(product);
  return imgs[0] ?? null;
}

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
