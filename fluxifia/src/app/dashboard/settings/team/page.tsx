import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TeamManager } from "./TeamManager";

export const metadata = { title: "Équipe" };

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId!;

  const members = await prisma.user.findMany({
    where: { orgId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Gérez les membres de votre organisation
        </p>
      </div>
      <TeamManager
        members={members}
        currentUserId={session!.user.id}
        currentUserRole={session!.user.role ?? "member"}
      />
    </div>
  );
}
