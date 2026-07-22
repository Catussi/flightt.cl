/** Número solo dígitos, sin + (ej: 56912345678). */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Enlace wa.me con texto prellenado. */
export function whatsappConsultUrl(phoneDigits: string, message: string): string {
  const n = digitsOnly(phoneDigits);
  if (!n) return "#";
  const q = encodeURIComponent(message);
  return `https://wa.me/${n}?text=${q}`;
}
