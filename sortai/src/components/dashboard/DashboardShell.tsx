"use client";

import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

interface Props {
  user: { name?: string | null; email: string; orgName: string | null };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: Props) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen flex" style={{ background: "var(--background)" }}>
      <Sidebar />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ease-in-out",
          collapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <DashboardHeader user={user} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
