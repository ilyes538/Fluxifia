import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsForm } from "@/components/dashboard/SettingsForm";

export const metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const [user, org] = await Promise.all([
    prisma.user.findUnique({ where: { id: session!.user.id } }),
    orgId ? prisma.organization.findUnique({ where: { id: orgId } }) : null,
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Gérez votre profil et les informations de votre entreprise</p>
      </div>
      <SettingsForm
        user={{ id: user!.id, name: user!.name ?? "", email: user!.email }}
        org={org ? { id: org.id, name: org.name, industry: org.industry ?? "", size: org.size ?? "" } : null}
      />
    </div>
  );
}
