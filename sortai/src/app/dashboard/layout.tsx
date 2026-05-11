import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");
  if (!session.user.emailVerified && session.user.role !== "owner" && session.user.role !== "admin") {
    redirect("/auth/verify-required");
  }

  return (
    <SidebarProvider>
      <DashboardShell user={session.user}>{children}</DashboardShell>
    </SidebarProvider>
  );
}
