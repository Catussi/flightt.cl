import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginCustomerForm } from "@/app/cuenta/entrar/LoginCustomerForm";
import { getCurrentCustomer } from "@/lib/customerAuth";
import { PublicHeader } from "@/components/PublicHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { prisma } from "@/lib/prisma";

export default async function CuentaEntrarPage() {
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
        <h1 className="text-xl font-semibold text-white">Entrar a tu cuenta</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Suma compras y desbloquea 20% en tu próxima prenda.
        </p>
        <div className="mt-8">
          <LoginCustomerForm />
        </div>
        <Link href="/" className="mt-8 block text-center text-sm text-zinc-500 hover:text-zinc-300">
          ← Catálogo
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
