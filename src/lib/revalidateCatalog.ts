import { revalidatePath } from "next/cache";
import { CATEGORY_CONFIG } from "@/lib/catalog/categories";

export function revalidateDropSlug(slug: string | null | undefined) {
  revalidatePath("/");
  if (slug) revalidatePath(`/d/${slug}`);
}

export function revalidateProductViews(code: string, dropSlug?: string | null) {
  revalidatePath("/");
  revalidatePath(`/p/${code}`);
  if (dropSlug) revalidatePath(`/d/${dropSlug}`);
  for (const c of Object.values(CATEGORY_CONFIG)) {
    revalidatePath(`/c/${c.slug}`);
  }
  revalidatePath("/ofertas");
}
