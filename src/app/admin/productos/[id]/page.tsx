import { redirect, notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditarProductoForm } from "./EditarProductoForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditarProductoPage({ params }: Props) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { drop: true },
  });
  if (!product) notFound();

  const drops = await prisma.drop.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, published: true },
  });

  return <EditarProductoForm product={product} drops={drops} />;
}
