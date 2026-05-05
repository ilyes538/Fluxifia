"use client";

import { useState } from "react";
import { Bot, Loader2, Settings, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface CatalogItem {
  type: string;
  name: string;
  description: string;
  requiredIntegrations: string[];
  icon: string;
}

interface AgentData {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  config: string;
  systemPrompt: string | null;
}

interface Props {
  agent: AgentData | null;
  catalog: CatalogItem;
  orgId: string;
  hasRequiredIntegration: boolean;
  canEnable: boolean;
  plan: string;
}

export function AgentCard({ agent, catalog, orgId, hasRequiredIntegration, canEnable, plan }: Props) {
  const [enabled, setEnabled] = useState(agent?.enabled ?? false);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? "");

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
        systemPrompt,
      }),
    });

    if (res.ok) setEnabled(!enabled);
    setLoading(false);
  }

  async function saveConfig() {
    if (!agent) return;
    setLoading(true);
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt }),
    });
    setShowConfig(false);
    setLoading(false);
  }

  return (
    <div className="card flex flex-col gap-4 transition-all hover:border-white/15"
      style={{ borderColor: enabled ? "rgba(124,58,237,0.4)" : undefined }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{catalog.icon}</span>
          <div>
            <h3 className="font-semibold">{catalog.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-green-500" : "bg-gray-600"}`} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {enabled ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {agent && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ color: "var(--text-muted)" }}
            >
              <Settings size={14} />
            </button>
          )}
          <button
            onClick={toggleAgent}
            disabled={loading || (!hasRequiredIntegration && !enabled) || (!canEnable && !enabled)}
            className="relative w-11 h-6 rounded-full transition-all focus:outline-none disabled:opacity-50"
            style={{
              background: enabled ? "var(--accent)" : "rgba(255,255,255,0.1)",
            }}
            title={
              !hasRequiredIntegration && !enabled
                ? "Connectez d'abord l'intégration requise"
                : !canEnable && !enabled
                ? "Limite d'agents atteinte — passez à un plan supérieur"
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

      <p className="text-sm" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
        {catalog.description}
      </p>

      {/* Required integrations warning */}
      {!hasRequiredIntegration && !enabled && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: "rgba(234,179,8,0.08)" }}>
          <AlertCircle size={13} style={{ color: "#fbbf24" }} className="shrink-0" />
          <p className="text-xs" style={{ color: "#fbbf24" }}>
            Requiert :{" "}
            {catalog.requiredIntegrations.join(" ou ")}.{" "}
            <Link href="/dashboard/integrations" className="underline">
              Connecter <ExternalLink size={10} className="inline" />
            </Link>
          </p>
        </div>
      )}

      {/* Plan limit warning */}
      {!canEnable && !enabled && (
        <div className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)" }}>
          <AlertCircle size={13} style={{ color: "#f87171" }} className="shrink-0" />
          <p className="text-xs" style={{ color: "#f87171" }}>
            Limite du plan {plan} atteinte.{" "}
            <Link href="/dashboard/billing" className="underline">Passer au plan supérieur</Link>
          </p>
        </div>
      )}

      {/* Config panel */}
      {showConfig && (
        <div className="pt-3 border-t space-y-3" style={{ borderColor: "var(--border)" }}>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Prompt système (optionnel)
            </label>
            <textarea
              className="input text-xs resize-none"
              rows={4}
              placeholder="Personnalisez le comportement de cet agent pour votre entreprise…"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveConfig} disabled={loading} className="btn-primary text-xs flex items-center gap-1">
              {loading && <Loader2 size={12} className="animate-spin" />}
              Enregistrer
            </button>
            <button onClick={() => setShowConfig(false)} className="btn-secondary text-xs">Annuler</button>
          </div>
        </div>
      )}

      {/* Runs stats */}
      {enabled && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <Bot size={11} />
          Agent en cours d&apos;exécution
        </div>
      )}
    </div>
  );
}
