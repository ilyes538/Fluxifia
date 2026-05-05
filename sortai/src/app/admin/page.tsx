import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Users, Building2, Bot, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim());

export const metadata = { title: "Admin — SortAI" };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || !ADMIN_EMAILS.includes(session.user.email ?? "")) {
    redirect("/dashboard");
  }

  const [totalOrgs, totalUsers, totalAgentRuns, planBreakdown, recentOrgs] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.agentRun.count(),
    prisma.subscription.groupBy({ by: ["plan"], _count: { id: true } }),
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        subscription: true,
        _count: { select: { users: true, agents: true } },
      },
    }),
  ]);

  const mrr = planBreakdown.reduce((sum, p) => {
    const prices: Record<string, number> = { free: 0, starter: 49, pro: 99, enterprise: 299 };
    return sum + (prices[p.plan] ?? 0) * p._count.id;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-gray-400 mt-1">Vue globale de la plateforme SortAI</p>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Organisations", value: totalOrgs, icon: Building2, color: "#a78bfa" },
            { label: "Utilisateurs", value: totalUsers, icon: Users, color: "#38bdf8" },
            { label: "Exécutions agents", value: totalAgentRuns.toLocaleString("fr-FR"), icon: Bot, color: "#34d399" },
            { label: "MRR estimé", value: `€${mrr}`, icon: TrendingUp, color: "#fbbf24" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{s.label}</span>
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Plan breakdown */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="font-semibold mb-4">Répartition par plan</h2>
          <div className="grid grid-cols-4 gap-4">
            {planBreakdown.map((p) => (
              <div key={p.plan} className="text-center">
                <div className="text-2xl font-bold">{p._count.id}</div>
                <div className="text-sm text-gray-400 capitalize">{p.plan}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orgs */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="font-semibold mb-4">Dernières organisations</h2>
          <div className="space-y-3">
            {recentOrgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="font-medium text-sm">{org.name}</p>
                  <p className="text-xs text-gray-400">{formatDate(org.createdAt)} · {org._count.users} utilisateur(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-800 capitalize">
                    {org.subscription?.plan ?? "free"}
                  </span>
                  <span className="text-xs text-gray-400">{org._count.agents} agent(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
