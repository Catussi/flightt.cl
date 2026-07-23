import Image from "next/image";
import Link from "next/link";
import type { Drop, Product } from "@prisma/client";
import { parseImages } from "@/lib/products";
import { getSaleInfo } from "@/lib/pricing";
import { consultMessageForProduct, whatsappHrefForProduct, whatsappNumber } from "@/lib/site";
import { PayButton } from "@/components/PayButton";
import { ProductPrice } from "@/components/ProductPrice";

export function ProductCardPublic({
  product,
  showOnlinePay = false,
}: {
  product: Product & { drop: Drop | null };
  showOnlinePay?: boolean;
}) {
  const imgs = parseImages(product);
  const src = imgs[0];
  const phone = whatsappNumber();
  const ariaMsg = consultMessageForProduct(product, product.drop?.name ?? null);
  const showWa = Boolean(phone);
  const waHref = showWa
    ? whatsappHrefForProduct(product, product.drop?.name ?? null)
    : "#";

  const codeUrl = encodeURIComponent(product.code);
  const sale = getSaleInfo(product);
  const pay =
    showOnlinePay && product.status === "AVAILABLE" ? (
      <PayButton productId={product.id} label="Pagar ahora" />
    ) : null;

  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 shadow-lg shadow-black/40">
      <Link
        href={`/p/${codeUrl}`}
        className="group flex min-h-0 flex-1 flex-col outline-none ring-amber-400/40 focus-visible:ring-2"
      >
        <div className="relative aspect-4/5 bg-zinc-800">
          {src ? (
            <Image
              src={src}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition group-hover:opacity-95"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
              Sin foto
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300 backdrop-blur">
            {product.code}
          </span>
          {product.drop ? (
            <span className="absolute right-2 top-2 rounded-md bg-zinc-900/80 px-2 py-0.5 text-[10px] font-medium text-amber-200/95 backdrop-blur">
              {product.drop.name}
            </span>
          ) : null}
          {sale ? (
            <span className="absolute bottom-2 left-2 rounded-md bg-rose-600/95 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
              -{sale.percent}%
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col space-y-1 px-3 pt-3">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-white group-hover:text-amber-50">
            {product.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            {product.brand ? (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                {product.brand}
              </span>
            ) : null}
            {product.size ? (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5">
                Talla {product.size}
              </span>
            ) : null}
          </div>
          <ProductPrice product={product} size="card" />
          {product.description ? (
            <p className="line-clamp-2 text-xs text-zinc-500">{product.description}</p>
          ) : null}
          <span className="pt-1 text-[10px] font-medium text-zinc-500 group-hover:text-zinc-400">
            Toca la ficha para ver fotos
          </span>
        </div>
      </Link>
      {product.drop ? (
        <div className="px-3 pb-2 pt-0">
          <Link
            href={`/d/${product.drop.slug}`}
            className="text-[10px] font-medium text-amber-500/90 hover:text-amber-400"
          >
            Ver drop: {product.drop.name} →
          </Link>
        </div>
      ) : null}
      <div className="mt-auto flex flex-col gap-2 border-t border-zinc-800/80 px-3 py-3">
        {pay}
        {showWa ? (
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            aria-label={ariaMsg}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-500"
          >
            WhatsApp
          </a>
        ) : null}
      </div>
    </li>
  );
}
