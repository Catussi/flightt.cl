import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterCustomerForm } from "@/app/cuenta/registro/RegisterCustomerForm";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export default async function CuentaRegistroPage() {
  const existing = await getCurrentCustomer();
  if (existing) redirect("/cuenta");

  const [publishedDrops, featuredDrop] = await Promise.all([
    prisma.drop.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { slug: true, name: true },
    }),
    prisma.drop.findFirst({ where: { featured: true, published: true } }),
  ]);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <PublicHeader featuredDrop={featuredDrop} publishedDrops={publishedDrops} />
      <main className="mx-auto max-w-sm px-4 py-10">
        <h1 className="text-xl font-semibold text-white">Crear cuenta</h1>
        <p className="mt-2 text-sm text-zinc-500">
          5 compras = 20% en la siguiente. No se combina con otras ofertas.
        </p>
        <div className="mt-8">
          <RegisterCustomerForm />
        </div>
        <Link href="/" className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          ← Catálogo
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
