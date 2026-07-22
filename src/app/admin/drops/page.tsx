import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DuplicateDropForm } from "@/components/DuplicateDropForm";
import { DeleteDropForm } from "@/components/DeleteDropForm";

export default async function AdminDropsPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const drops = await prisma.drop.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              Contenido
            </p>
            <h1 className="text-lg font-semibold text-white">Drops</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/drops/nueva"
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
            >
              Nuevo drop
            </Link>
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300"
            >
              Inventario
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 px-4 py-4">
        {drops.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
            Crea el primer drop para agrupar el próximo cargamento.
          </p>
        ) : (
          <ul className="space-y-3">
            {drops.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{d.name}</h2>
                    {d.published ? (
                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-emerald-400">
                        Publicado
                      </span>
                    ) : (
                      <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] uppercase text-zinc-500">
                        Borrador
                      </span>
                    )}
                    {d.featured ? (
                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-400">
                        Destacado
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    /d/{d.slug} · {d._count.products} prendas
                  </p>
                  {d.location ? (
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{d.location}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {d.published ? (
                    <Link
                      href={`/d/${d.slug}`}
                      target="_blank"
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
                    >
                      Ver
                    </Link>
                  ) : null}
                  <Link
                    href={`/admin/drops/${d.id}`}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
                  >
                    Editar
                  </Link>
                  <DuplicateDropForm id={d.id} />
                  <DeleteDropForm id={d.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
