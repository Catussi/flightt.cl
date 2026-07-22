"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  CUSTOMER_SESSION_COOKIE,
  signCustomerSession,
} from "@/lib/customerSession";

function sessionSecret(): string {
  const s = process.env.SESSION_SECRET?.trim() ?? "";
  if (s.length < 16) throw new Error("SESSION_SECRET inválido");
  return s;
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function setCustomerCookie(customerId: string) {
  const jar = await cookies();
  jar.set(CUSTOMER_SESSION_COOKIE, signCustomerSession(customerId, sessionSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function registerCustomerAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = normalizeEmail(formData.get("email")?.toString() ?? "");
  const password = formData.get("password")?.toString() ?? "";
  const firstName = formData.get("firstName")?.toString().trim() || null;
  const lastName = formData.get("lastName")?.toString().trim() || null;

  if (!isValidEmail(email)) return { error: "Correo inválido" };
  if (password.length < 8) return { error: "La clave debe tener al menos 8 caracteres" };

  const exists = await prisma.customer.findUnique({ where: { email } });
  if (exists) return { error: "Ya existe una cuenta con ese correo" };

  const customer = await prisma.customer.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      firstName,
      lastName,
    },
  });

  await setCustomerCookie(customer.id);
  redirect("/cuenta");
}

export async function loginCustomerAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = normalizeEmail(formData.get("email")?.toString() ?? "");
  const password = formData.get("password")?.toString() ?? "";

  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return { error: "Correo o clave incorrectos" };
  }

  await setCustomerCookie(customer.id);
  redirect("/cuenta");
}

export async function logoutCustomerAction() {
  const jar = await cookies();
  jar.delete(CUSTOMER_SESSION_COOKIE);
  redirect("/");
}
