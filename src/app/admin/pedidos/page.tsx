import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions";
import { AdminOrderList } from "@/components/AdminOrderList";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPedidosPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const orders = await prisma.order.findMany({
    where: { status: "PAID" },
    include: { product: true },
    orderBy: { updatedAt: "desc" },
  });

  const pendingData = orders.filter((o) => o.fulfillmentStatus === "AWAITING_DETAILS").length;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/90">
              Ventas
            </p>
            <h1 className="text-lg font-semibold text-white">Pedidos</h1>
            <p className="text-xs text-zinc-500">
              {orders.length} pagados · {pendingData} sin datos de entrega
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-zinc-600 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-400"
            >
              Inventario
            </Link>
            <Link
              href="/"
              className="rounded-full border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500"
            >
              Ver tienda
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        <AdminOrderList orders={orders} />
      </main>
    </div>
  );
}
