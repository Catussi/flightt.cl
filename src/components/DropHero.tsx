import Link from "next/link";
import type { Drop } from "@prisma/client";
import { whatsappNumber } from "@/lib/site";
import { whatsappConsultUrl } from "@/lib/whatsapp";

export function DropHero({
  drop,
  showCatalogLink = true,
  emphasis = "featured",
}: {
  drop: Drop;
  showCatalogLink?: boolean;
  emphasis?: "featured" | "page";
}) {
  const phone = whatsappNumber();
  const generalWa =
    phone &&
    whatsappConsultUrl(
      phone,
      `Hola, consulto por el drop «${drop.name}». ¿Qué tienes disponible?`,
    );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/15 via-zinc-900/80 to-zinc-950 px-4 py-5 sm:px-6">
      <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-amber-500/10 blur-3xl" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-400/80">
        {emphasis === "featured" ? "Drop destacado" : "Drop"}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">{drop.name}</h2>
      {drop.schedule ? (
        <p className="mt-2 whitespace-pre-line text-sm text-amber-100/85">{drop.schedule}</p>
      ) : null}
      {drop.location ? (
        <p className="mt-1 flex items-start gap-2 text-sm text-zinc-300">
          <span aria-hidden className="text-amber-400/90">
            📍
          </span>
          <span>{drop.location}</span>
        </p>
      ) : null}
      {drop.note ? (
        <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-zinc-400">
          {drop.note}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {showCatalogLink ? (
          <Link
            href={`/d/${drop.slug}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
          >
            Ver prendas del drop
          </Link>
        ) : null}
        {generalWa ? (
          <a
            href={generalWa}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-emerald-500/50 bg-emerald-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Escribir por WhatsApp
          </a>
        ) : null}
      </div>
    </section>
  );
}
