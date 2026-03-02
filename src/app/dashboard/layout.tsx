import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClientLayout } from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
