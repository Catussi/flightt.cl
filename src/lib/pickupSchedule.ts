import type { PickupDay } from "@prisma/client";

const TARGET_DOW: Record<PickupDay, number> = {
  THURSDAY: 4,
  SUNDAY: 0,
};

/** Próximo jueves o domingo (mínimo mañana) para retiro en feria. */
export function nextPickupOn(day: PickupDay, from: Date = new Date()): Date {
  const want = TARGET_DOW[day];
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);

  for (let i = 0; i < 8; i++) {
    if (d.getDay() === want) return d;
    d.setDate(d.getDate() + 1);
  }

  return d;
}

export function pickupDayLabelEs(day: PickupDay): string {
  return day === "THURSDAY" ? "jueves" : "domingo";
}

/** ¿La fecha de retiro es mañana (día calendario local del servidor)? */
export function isPickupTomorrow(pickupOn: Date, now: Date = new Date()): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    pickupOn.getFullYear() === tomorrow.getFullYear() &&
    pickupOn.getMonth() === tomorrow.getMonth() &&
    pickupOn.getDate() === tomorrow.getDate()
  );
}
