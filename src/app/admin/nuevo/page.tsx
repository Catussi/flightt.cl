import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNuevoForm } from "./AdminNuevoForm";

export default async function AdminNuevoPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const drops = await prisma.drop.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, published: true, featured: true },
  });

  const defaultDropId =
    drops.find((d) => d.featured && d.published)?.id ??
    drops.find((d) => d.published)?.id ??
    "";

  return (
    <AdminNuevoForm
      drops={drops}
      defaultDropId={defaultDropId}
    />
  );
}
