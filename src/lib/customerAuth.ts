import { cookies } from "next/headers";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  CUSTOMER_SESSION_COOKIE,
  verifyCustomerSession,
} from "@/lib/customerSession";

function sessionSecret(): string | undefined {
  const s = process.env.SESSION_SECRET?.trim();
  return s && s.length >= 16 ? s : undefined;
}

export async function getCustomerId(): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const token = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyCustomerSession(token, secret);
}

export async function getCurrentCustomer(): Promise<Customer | null> {
  const id = await getCustomerId();
  if (!id) return null;
  return prisma.customer.findUnique({ where: { id } });
}
