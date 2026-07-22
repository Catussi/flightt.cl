import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditarDropForm } from "./EditarDropForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditarDropPage({ params }: Props) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const drop = await prisma.drop.findUnique({ where: { id } });
  if (!drop) notFound();

  return (
    <div className="min-h-full bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              Drops
            </p>
            <h1 className="text-xl font-semibold text-white">Editar drop</h1>
          </div>
          <Link href="/admin/drops" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Lista
          </Link>
        </div>
        <div className="mt-6">
          <EditarDropForm drop={drop} />
        </div>
      </div>
    </div>
  );
}
