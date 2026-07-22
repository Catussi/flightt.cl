import type { ProductCategory } from "@prisma/client";

export const MAX_PRODUCT_IMAGES = 7;

export const CATEGORY_CONFIG: Record<
  ProductCategory,
  { slug: string; label: string; description: string }
> = {
  TOP: {
    slug: "arriba",
    label: "Arriba",
    description: "Chaquetas, polerones, poleras y tops.",
  },
  BOTTOM: {
    slug: "abajo",
    label: "Abajo",
    description: "Buzos, pantalones y piezas de abajo.",
  },
  ACCESSORY: {
    slug: "accesorios",
    label: "Accesorios",
    description: "Gorros, cinturones, bolsos y más.",
  },
};

const SLUG_TO_CATEGORY = Object.fromEntries(
  (Object.entries(CATEGORY_CONFIG) as [ProductCategory, (typeof CATEGORY_CONFIG)[ProductCategory]][]).map(
    ([key, val]) => [val.slug, key],
  ),
) as Record<string, ProductCategory>;

export function categoryFromSlug(slug: string): ProductCategory | null {
  return SLUG_TO_CATEGORY[slug] ?? null;
}

export function categoryLabel(cat: ProductCategory): string {
  return CATEGORY_CONFIG[cat].label;
}

export function categorySlug(cat: ProductCategory): string {
  return CATEGORY_CONFIG[cat].slug;
}

export function allCategories(): ProductCategory[] {
  return ["TOP", "BOTTOM", "ACCESSORY"];
}

export function parseProductCategory(raw: string | null | undefined): ProductCategory | null {
  const v = raw?.trim().toUpperCase();
  if (v === "TOP" || v === "BOTTOM" || v === "ACCESSORY") return v;
  return null;
}
