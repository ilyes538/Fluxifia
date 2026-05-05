"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface CatalogItem {
  type: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  scopes: string[];
  authUrl: string;
}

interface IntegrationData {
  id: string;
  type: string;
  connected: boolean;
  metadata: string;
}

interface Props {
  catalog: CatalogItem;
  integration: IntegrationData | null;
}

export function IntegrationCard({ catalog, integration }: Props) {
  const [loading, setLoading] = useState(false);
  const connected = integration?.connected ?? false;

  let meta: { email?: string; workspace?: string; name?: string } = {};
  try { meta = JSON.parse(integration?.metadata ?? "{}"); } catch { /* ignore */ }

  function handleConnect() {
    window.location.href = catalog.authUrl;
  }

  async function handleDisconnect() {
    if (!integration) return;
    setLoading(true);
    await fetch(`/api/integrations/${integration.id}`, {
      method: "DELETE",
    });
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="card hover:border-white/15 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${catalog.color}15`, border: `1px solid ${catalog.color}25` }}>
            {catalog.icon}
          </div>
          <div>
            <h3 className="font-semibold">{catalog.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {connected ? (
                <>
                  <CheckCircle2 size={12} style={{ color: "var(--green)" }} />
                  <span className="text-xs" style={{ color: "var(--green)" }}>Connecté</span>
                  {(meta.email || meta.workspace || meta.name) && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      — {meta.email || meta.workspace || meta.name}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle size={12} style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>Non connecté</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm mb-4" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
        {catalog.description}
      </p>

      {/* Scopes */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {catalog.scopes.map((s) => (
          <span key={s} className="badge badge-gray text-xs">{s}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {connected ? (
          <>
            <button
              onClick={handleConnect}
              className="btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center"
            >
              <RefreshCw size={12} />
              Reconnecter
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="btn-secondary text-xs flex items-center gap-1.5 flex-1 justify-center"
              style={{ color: "#f87171" }}
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
              Déconnecter
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            className="btn-primary text-xs flex items-center gap-1.5 flex-1 justify-center"
          >
            <ExternalLink size={12} />
            Connecter {catalog.name}
          </button>
        )}
      </div>
    </div>
  );
}
