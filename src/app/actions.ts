"use server";

import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import {
  revalidateDropSlug,
  revalidateProductViews,
} from "@/lib/revalidateCatalog";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { slugify } from "@/lib/slug";
import {
  MAX_PRODUCT_IMAGES,
  parseProductCategory,
} from "@/lib/catalog/categories";
import {
  parseDiscountEndsAt,
  parseDiscountPercent,
} from "@/lib/pricing";
import { saveProductImage } from "@/lib/uploads";

function safeEqualString(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

async function saveUpload(file: File): Promise<string> {
  return saveProductImage(file);
}

async function nextProductCode(): Promise<string> {
  const n = await prisma.product.count();
  return `FT-${String(n + 1).padStart(3, "0")}`;
}

async function uniqueDropSlug(base: string): Promise<string> {
  let s = base;
  let i = 0;
  while (await prisma.drop.findUnique({ where: { slug: s } })) {
    i += 1;
    s = `${base}-${i}`;
  }
  return s;
}

async function applyFeaturedFlag(dropId: string, featured: boolean) {
  if (featured) {
    await prisma.drop.updateMany({
      where: { NOT: { id: dropId } },
      data: { featured: false },
    });
  }
  await prisma.drop.update({
    where: { id: dropId },
    data: { featured },
  });
}

/** Si un drop era destacado y se despublica, quitar destacado. */
async function syncDropFeaturedOnPublish(dropId: string, published: boolean) {
  if (!published) {
    await prisma.drop.update({
      where: { id: dropId },
      data: { featured: false },
    });
  }
}

export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = formData.get("password")?.toString() ?? "";
  const expected = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.SESSION_SECRET ?? "";
  if (!expected || !secret || secret.length < 16) {
    return { error: "Servicio no configurado. Contacta al administrador." };
  }
  if (!safeEqualString(password, expected)) {
    return { error: "Clave incorrecta" };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

export async function markSoldAction(productId: string) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status: "SOLD", soldAt: new Date() },
    include: { drop: { select: { slug: true } } },
  });
  revalidateProductViews(updated.code, updated.drop?.slug);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/drops");
}

export async function markAvailableAction(productId: string) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status: "AVAILABLE", soldAt: null },
    include: { drop: { select: { slug: true } } },
  });
  revalidateProductViews(updated.code, updated.drop?.slug);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/drops");
}

export async function createProductAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "No autorizado" };

  const title = formData.get("title")?.toString().trim() ?? "";
  const priceRaw = formData.get("price")?.toString() ?? "";
  const price = Number(priceRaw.replace(/\./g, "").replace(",", ""));
  const size = formData.get("size")?.toString().trim() || null;
  const brand = formData.get("brand")?.toString().trim() || null;
  const description = formData.get("description")?.toString().trim() || null;
  const dropIdRaw = formData.get("dropId")?.toString().trim() || "";
  const category =
    parseProductCategory(formData.get("category")?.toString()) ?? "TOP";

  let dropId: string | null = null;
  if (dropIdRaw) {
    const d = await prisma.drop.findFirst({
      where: { id: dropIdRaw },
    });
    if (d) dropId = d.id;
  }

  if (!title || !Number.isFinite(price) || price < 0) {
    return { error: "Título y precio válidos requeridos" };
  }

  const discountPercent = parseDiscountPercent(
    formData.get("discountPercent")?.toString(),
  );
  const discountEndsAt = parseDiscountEndsAt(
    formData.get("discountEndsAt")?.toString(),
  );

  if (discountPercent != null) {
    if (!discountEndsAt) {
      return { error: "Si pones descuento, indica fecha y hora de término" };
    }
    if (discountEndsAt <= new Date()) {
      return { error: "La oferta debe terminar en el futuro" };
    }
  }

  const files = formData
    .getAll("images")
    .filter((x): x is File => x instanceof File && x.size > 0);

  if (files.length === 0) {
    return { error: "Sube al menos una foto" };
  }
  if (files.length > MAX_PRODUCT_IMAGES) {
    return { error: `Máximo ${MAX_PRODUCT_IMAGES} fotos por prenda` };
  }

  const urls: string[] = [];
  for (const file of files) {
    if (file.size > 6 * 1024 * 1024) {
      return { error: "Alguna foto supera 6 MB" };
    }
    urls.push(await saveUpload(file));
  }

  const code = await nextProductCode();
  const created = await prisma.product.create({
    data: {
      code,
      title,
      price: Math.round(price),
      size,
      brand,
      description,
      images: JSON.stringify(urls),
      dropId,
      category,
      discountPercent: discountPercent ?? null,
      discountEndsAt: discountPercent != null ? discountEndsAt : null,
    },
    include: { drop: { select: { slug: true } } },
  });

  revalidateProductViews(created.code, created.drop?.slug);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/drops");
  redirect("/admin/dashboard");
}

export async function createDropAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "No autorizado" };

  const name = formData.get("name")?.toString().trim() ?? "";
  if (!name) return { error: "Nombre del drop requerido" };

  const slugOverride = formData.get("slug")?.toString().trim();
  const base = slugify(slugOverride || name);
  const slug = await uniqueDropSlug(base);

  const location = formData.get("location")?.toString().trim() || null;
  const schedule = formData.get("schedule")?.toString().trim() || null;
  const note = formData.get("note")?.toString().trim() || null;
  const published = formData.get("published") === "on";
  const featured = formData.get("featured") === "on";

  const drop = await prisma.drop.create({
    data: {
      slug,
      name,
      location,
      schedule,
      note,
      published,
      featured: false,
    },
  });

  if (featured && published) {
    await applyFeaturedFlag(drop.id, true);
  } else if (featured && !published) {
    await prisma.drop.update({
      where: { id: drop.id },
      data: { featured: false },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/drops");
  revalidatePath(`/d/${slug}`);
  redirect("/admin/drops");
}

export async function updateDropAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  if (!(await isAdmin())) return { error: "No autorizado" };

  const id = formData.get("id")?.toString().trim();
  if (!id) return { error: "Drop inválido" };

  const existing = await prisma.drop.findUnique({ where: { id } });
  if (!existing) return { error: "Drop no encontrado" };

  const name = formData.get("name")?.toString().trim() ?? "";
  if (!name) return { error: "Nombre requerido" };

  let slug = existing.slug;
  const slugInput = formData.get("slug")?.toString().trim();
  if (slugInput && slugify(slugInput) !== existing.slug) {
    const candidate = await uniqueDropSlug(slugify(slugInput));
    slug = candidate;
  }

  const location = formData.get("location")?.toString().trim() || null;
  const schedule = formData.get("schedule")?.toString().trim() || null;
  const note = formData.get("note")?.toString().trim() || null;
  const published = formData.get("published") === "on";
  const featured = formData.get("featured") === "on";

  const oldSlug = existing.slug;

  await prisma.drop.update({
    where: { id },
    data: {
      slug,
      name,
      location,
      schedule,
      note,
      published,
    },
  });

  await syncDropFeaturedOnPublish(id, published);

  if (featured && published) {
    await applyFeaturedFlag(id, true);
  } else {
    await prisma.drop.update({
      where: { id },
      data: { featured: false },
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/drops");
  if (oldSlug !== slug) revalidatePath(`/d/${oldSlug}`);
  revalidateDropSlug(slug);
  redirect("/admin/drops");
}

export async function duplicateDropAction(formData: FormData) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const id = formData.get("id")?.toString().trim();
  if (!id) return;

  const source = await prisma.drop.findUnique({ where: { id } });
  if (!source) return;

  const base = slugify(`${source.name}-copia`);
  const slug = await uniqueDropSlug(base);

  await prisma.drop.create({
    data: {
      slug,
      name: `${source.name} (copia)`,
      location: source.location,
      schedule: source.schedule,
      note: source.note,
      published: false,
      featured: false,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/drops");
  redirect("/admin/drops");
}

export async function adjustProductSortAction(productId: string, delta: number) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: { drop: { select: { slug: true } } },
  });
  if (!p) return;

  const next = Math.max(0, p.sortOrder + delta);
  await prisma.product.update({
    where: { id: productId },
    data: { sortOrder: next },
  });

  revalidateProductViews(p.code, p.drop?.slug);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/drops");
}

export async function pinProductFirstAction(productId: string) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const agg = await prisma.product.aggregate({ _max: { sortOrder: true } });
  const top = (agg._max?.sortOrder ?? 0) + 1;

  const p = await prisma.product.update({
    where: { id: productId },
    data: { sortOrder: top },
    include: { drop: { select: { slug: true } } },
  });

  revalidateProductViews(p.code, p.drop?.slug);
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/drops");
}

export async function deleteDropAction(formData: FormData) {
  if (!(await isAdmin())) throw new Error("No autorizado");
  const id = formData.get("id")?.toString().trim();
  if (!id) return;

  const d = await prisma.drop.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!d) return;

  await prisma.drop.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/admin/drops");
  revalidatePath(`/d/${d.slug}`);
  redirect("/admin/drops");
}
