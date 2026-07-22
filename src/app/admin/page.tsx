import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";

export default async function AdminIndexPage() {
  if (await isAdmin()) redirect("/admin/dashboard");
  redirect("/admin/login");
}
