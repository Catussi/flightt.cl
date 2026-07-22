import type { Product } from "@prisma/client";
import { formatCLP } from "./products";
import { effectivePriceClp } from "./pricing";
import { whatsappConsultUrl } from "./whatsapp";

export function storeName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME?.trim() || "Flightt";
}

/** Número WhatsApp (solo dígitos). Vacío = sin botón. */
export function whatsappNumber(): string {
  const raw =
    process.env.WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    "";
  return raw.replace(/\D/g, "");
}

export function consultMessageForProduct(p: Product, dropName?: string | null): string {
  const pay = effectivePriceClp(p);
  const lines = [
    `Hola, consulto por ${p.code}: ${p.title}`,
    pay < p.price
      ? `Precio oferta: ${formatCLP(pay)} (antes ${formatCLP(p.price)})`
      : `Precio: ${formatCLP(p.price)}`,
  ];
  if (dropName) lines.push(`Drop: ${dropName}`);
  lines.push("¿Sigue disponible?");
  return lines.join("\n");
}

export function whatsappHrefForProduct(
  p: Product,
  dropName?: string | null,
): string {
  const phone = whatsappNumber();
  return whatsappConsultUrl(phone, consultMessageForProduct(p, dropName));
}

export function footerLines(): string[] {
  const raw = process.env.STORE_FOOTER?.trim();
  if (!raw) {
    return [
      "Envíos Starken por pagar (costo a cargo del cliente).",
      "Retiro en feria: jueves o domingo.",
      "Sin cambios ni devoluciones salvo error nuestro.",
      "Consultas por Instagram o WhatsApp.",
    ];
  }
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

/** Public Instagram profile URL for product inquiries. */
export function instagramUrl(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() ||
    process.env.INSTAGRAM_URL?.trim() ||
    "";
  return raw || undefined;
}
