import { createHmac, timingSafeEqual } from "crypto";

export const CUSTOMER_SESSION_COOKIE = "flightt_customer";

export function signCustomerSession(userId: string, secret: string): string {
  const issued = Date.now().toString();
  const payload = `${userId}.${issued}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyCustomerSession(
  token: string,
  secret: string,
  maxAgeMs = 30 * 24 * 60 * 60 * 1000,
): string | null {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parts = raw.split(".");
    if (parts.length !== 3) return null;
    const [userId, issued, sig] = parts;
    if (!userId || !issued || !sig) return null;
    const payload = `${userId}.${issued}`;
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const ts = Number(issued);
    if (Number.isNaN(ts) || Date.now() - ts > maxAgeMs) return null;
    return userId;
  } catch {
    return null;
  }
}
