import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { NuevaDropForm } from "./NuevaDropForm";

export default async function NuevaDropPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-full bg-zinc-950 px-4 py-6 text-zinc-100">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              Drops
            </p>
            <h1 className="text-xl font-semibold text-white">Nuevo drop</h1>
          </div>
          <Link href="/admin/drops" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Lista
          </Link>
        </div>
        <div className="mt-6">
          <NuevaDropForm />
        </div>
      </div>
    </div>
  );
}
