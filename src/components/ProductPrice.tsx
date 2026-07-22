import type { Product } from "@prisma/client";
import { formatCLP } from "@/lib/products";
import { formatSaleEndsAt, getSaleInfo } from "@/lib/pricing";

export function ProductPrice({
  product,
  size = "card",
}: {
  product: Pick<Product, "price" | "discountPercent" | "discountEndsAt">;
  size?: "card" | "page";
}) {
  const sale = getSaleInfo(product);

  if (!sale) {
    return (
      <p
        className={
          size === "page"
            ? "text-2xl font-bold text-amber-400"
            : "pt-1 text-base font-semibold text-amber-400"
        }
      >
        {formatCLP(product.price)}
      </p>
    );
  }

  const priceClass =
    size === "page" ? "text-2xl font-bold text-rose-400" : "text-base font-semibold text-rose-400";

  return (
    <div className={size === "page" ? "space-y-1" : "pt-1 space-y-0.5"}>
      <div className="flex flex-wrap items-center gap-2">
        <p className={priceClass}>{formatCLP(sale.effectivePrice)}</p>
        <span className="rounded-md bg-rose-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
          -{sale.percent}%
        </span>
      </div>
      <p
        className={
          size === "page"
            ? "text-lg text-zinc-500 line-through"
            : "text-sm text-zinc-500 line-through"
        }
      >
        {formatCLP(product.price)}
      </p>
      {size === "page" ? (
        <p className="text-xs text-zinc-500">
          Oferta hasta {formatSaleEndsAt(sale.endsAt)}
        </p>
      ) : null}
    </div>
  );
}
