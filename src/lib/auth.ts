import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";

export async function isAdmin(): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySession(token, secret);
}
