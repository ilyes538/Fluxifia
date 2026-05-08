"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Props {
  agent: { id: string; type: string; name: string; enabled: boolean } | null;
  catalog: { type: string; name: string; description: string; icon: string; requiredIntegrations: string[] };
  orgId: string;
  hasRequiredIntegration: boolean;
  canEnable: boolean;
  plan: string;
}

export function DashboardAgentToggle({ agent, catalog, orgId, hasRequiredIntegration, canEnable, plan }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(agent?.enabled ?? false);
  const [loading, setLoading] = useState(false);

  async function toggleAgent() {
    if (loading) return;
    if (!enabled && !canEnable) return;
    setLoading(true);

    const res = await fetch("/api/agents", {
      method: agent ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: agent?.id,
        type: catalog.type,
        name: catalog.name,
        description: catalog.description,
        orgId,
        enabled: !enabled,
      }),
    });

    if (res.ok) {
      setEnabled(!enabled);
      // Revalide le Server Component pour mettre à jour activeCount, canEnable, etc.
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl">{catalog.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{catalog.name}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            {enabled ? "Actif" : "Inactif"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!hasRequiredIntegration && !enabled && (
          <Link
            href="/dashboard/integrations"
            className="text-xs flex items-center gap-0.5 hover:text-white transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Connecter <ExternalLink size={10} />
          </Link>
        )}

        {!canEnable && !enabled && (
          <Link
            href="/dashboard/billing"
            className="text-xs flex items-center gap-0.5 hover:text-white transition-colors"
            style={{ color: "#fbbf24" }}
          >
            Upgrade
          </Link>
        )}

        <button
          onClick={toggleAgent}
          disabled={loading || (!hasRequiredIntegration && !enabled) || (!canEnable && !enabled)}
          className="relative w-11 h-6 rounded-full transition-all focus:outline-none disabled:opacity-50"
          style={{ background: enabled ? "var(--accent)" : "rgba(255,255,255,0.1)" }}
          title={
            !hasRequiredIntegration && !enabled
              ? "Connectez d'abord l'intégration"
              : !canEnable && !enabled
              ? "Limite d'agents atteinte"
              : undefined
          }
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
          ) : (
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
              style={{ left: enabled ? "calc(100% - 1.25rem)" : "0.25rem" }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
