"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";

export function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Topbar
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main
        className={cn(
          "pt-16 transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}
