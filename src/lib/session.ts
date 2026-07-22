import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "flightt_session";

export function signSession(secret: string): string {
  const issued = Date.now().toString();
  const sig = createHmac("sha256", secret).update(issued).digest("hex");
  return Buffer.from(`${issued}.${sig}`).toString("base64url");
}

export function verifySession(
  token: string,
  secret: string,
  maxAgeMs = 14 * 24 * 60 * 60 * 1000,
): boolean {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const [issued, sig] = raw.split(".");
    if (!issued || !sig) return false;
    const expected = createHmac("sha256", secret).update(issued).digest("hex");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const ts = Number(issued);
    if (Number.isNaN(ts) || Date.now() - ts > maxAgeMs) return false;
    return true;
  } catch {
    return false;
  }
}
