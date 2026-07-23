import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isPaymentBrickConfigured } from "@/lib/payments/config";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/products";
import { categoryLabel } from "@/lib/catalog/categories";
import { consultMessageForProduct, instagramUrl, storeName, whatsappHrefForProduct, whatsappNumber } from "@/lib/site";
import { PayButton } from "@/components/PayButton";
import { ProductPrice } from "@/components/ProductPrice";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);
  const product = await prisma.product.findUnique({
    where: { code },
    select: { title: true, code: true, status: true },
  });
  const shop = storeName();
  if (!product) {
    return { title: `Prenda no encontrada · ${shop}` };
  }
  const suffix = product.status === "SOLD" ? " (vendida)" : "";
  return {
    title: `${product.code} · ${product.title}${suffix}`,
    description: `${product.code} — ${product.title}. Consulta en ${shop}.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { code: rawCode } = await params;
  const code = decodeURIComponent(rawCode);

  const [product, featuredDrop, publishedDrops] = await Promise.all([
    prisma.product.findUnique({
      where: { code },
      include: { drop: true },
    }),
    prisma.drop.findFirst({
      where: { featured: true, published: true },
    }),
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
  ]);

  if (!product) notFound();

  const imgs = parseImages(product);
  const sold = product.status === "SOLD";
  const phone = whatsappNumber();
  const waHref = phone
    ? whatsappHrefForProduct(product, product.drop?.name ?? null)
    : null;
  const ariaMsg = consultMessageForProduct(product, product.drop?.name ?? null);
  const showPay = isPaymentBrickConfigured() && !sold;
  const ig = instagramUrl();

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />

      <main className="mx-auto max-w-3xl px-4 py-6">
        <nav className="mb-4 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">
            Catálogo
          </Link>
          {product.drop ? (
            <>
              <span className="mx-1.5">/</span>
              <Link href={`/d/${product.drop.slug}`} className="hover:text-zinc-300">
                {product.drop.name}
              </Link>
            </>
          ) : null}
          <span className="mx-1.5">/</span>
          <span className="text-zinc-400">{product.code}</span>
        </nav>

        {sold ? (
          <div className="mb-4 rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            Esta prenda ya no está disponible.
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              {product.code}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">{product.title}</h1>
            <div className="mt-2">
              <ProductPrice product={product} size="page" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-400">
              <span className="rounded-lg bg-zinc-800 px-2 py-1 text-amber-200/90">
                {categoryLabel(product.category)}
              </span>
              {product.brand ? (
                <span className="rounded-lg bg-zinc-800 px-2 py-1">{product.brand}</span>
              ) : null}
              {product.size ? (
                <span className="rounded-lg bg-zinc-800 px-2 py-1">Talla {product.size}</span>
              ) : null}
            </div>
          </div>
        </div>

        {product.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
            {product.description}
          </p>
        ) : null}

        {imgs.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {imgs.map((src, i) => (
              <li
                key={src}
                className="relative aspect-4/5 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 sm:aspect-video"
              >
                <Image
                  src={src}
                  alt={`${product.title} — foto ${i + 1}`}
                  fill
                  sizes="(max-width:768px) 100vw, 42rem"
                  className="object-contain bg-black/40"
                  priority={i === 0}
                />
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {showPay ? (
            <div className="flex min-w-[200px] flex-1 flex-col justify-stretch">
              <PayButton productId={product.id} label="Comprar" />
            </div>
          ) : null}
          {!sold && ig ? (
            <a
              href={ig}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-[200px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 text-center text-base font-semibold text-white hover:opacity-95"
            >
              Consultar por Instagram
            </a>
          ) : null}
          {!sold && waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              aria-label={ariaMsg}
              className="flex min-w-[200px] flex-1 items-center justify-center rounded-xl bg-emerald-600 py-4 text-center text-base font-semibold text-white hover:bg-emerald-500"
            >
              Consultar por WhatsApp
            </a>
          ) : !sold && !phone && !showPay ? (
            <span className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-700 py-4 text-sm text-zinc-500">
              Consultas disponibles pronto
            </span>
          ) : null}
          <Link
            href="/"
            className="flex min-w-[140px] flex-1 items-center justify-center rounded-xl border border-zinc-700 py-4 text-center text-sm font-medium text-zinc-300 hover:border-zinc-500"
          >
            Ver más prendas
          </Link>
        </div>

        <p className="mt-6 break-all text-center text-xs text-zinc-600">
          Enlace directo: <span className="text-zinc-500">/p/{encodeURIComponent(product.code)}</span>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
