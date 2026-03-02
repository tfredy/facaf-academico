import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardClientLayout } from "./layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (err) {
    console.error("[Dashboard] auth error:", err);
    redirect("/login?error=Config");
  }
  if (!session) redirect("/login");
  return <DashboardClientLayout>{children}</DashboardClientLayout>;
}
