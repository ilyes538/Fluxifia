"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Send, Mail, AlertCircle, Tag, Clock, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Email {
  id: string;
  gmailId: string | null;
  subject: string | null;
  from: string | null;
  body: string | null;
  category: string | null;
  priority: string | null;
  summary: string | null;
  aiReply: string | null;
  replied: boolean;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  urgent: "#ef4444",
  support: "#f59e0b",
  commercial: "#3b82f6",
  newsletter: "#8b5cf6",
  internal: "#10b981",
  other: "#6b7280",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

export function EmailInbox({
  initialEmails,
  gmailConnected,
  agentEnabled,
}: {
  initialEmails: Email[];
  gmailConnected: boolean;
  agentEnabled: boolean;
}) {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    const res = await fetch("/api/email/list");
    const data = await res.json();
    if (data.emails) setEmails(data.emails);
  }, []);

  // Auto-sync every 5 minutes
  useEffect(() => {
    if (!gmailConnected || !agentEnabled) return;
    const interval = setInterval(() => {
      handleSync(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [gmailConnected, agentEnabled]);

  async function handleSync(silent = false) {
    if (syncing) return;
    setSyncing(true);
    if (!silent) setSyncResult(null);

    const res = await fetch("/api/email/sync", { method: "POST" });
    const data = await res.json();

    setSyncing(false);
    if (!silent) {
      setSyncResult(
        data.processed > 0
          ? `${data.processed} nouvel(s) email(s) traité(s)`
          : "Aucun nouvel email"
      );
      setTimeout(() => setSyncResult(null), 4000);
    }
    await fetchEmails();
  }

  async function handleSendReply(email: Email) {
    const replyText = replyTexts[email.id];
    if (!replyText?.trim()) return;

    setSendingId(email.id);
    const res = await fetch("/api/email/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailLogId: email.id, replyText }),
    });

    setSendingId(null);
    if (res.ok) {
      setReplyingId(null);
      await fetchEmails();
    }
  }

  if (!gmailConnected) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <Mail size={48} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
        <h2 className="text-xl font-semibold">Gmail non connecté</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Connectez Gmail dans les intégrations pour activer la boîte email IA.
        </p>
        <a href="/dashboard/integrations" className="btn-primary inline-flex">
          Connecter Gmail
        </a>
      </div>
    );
  }

  if (!agentEnabled) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <AlertCircle size={48} style={{ color: "#f59e0b", margin: "0 auto" }} />
        <h2 className="text-xl font-semibold">Agent Email non activé</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Créez et activez un agent de type "Email" pour traiter vos emails.
        </p>
        <a href="/dashboard/agents" className="btn-primary inline-flex">
          Gérer les agents
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Boîte Email IA</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {emails.length} email(s) traité(s) — synchronisation automatique toutes les 5 min
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncResult && (
            <span className="text-sm" style={{ color: "var(--green)" }}>{syncResult}</span>
          )}
          <button
            onClick={() => handleSync()}
            disabled={syncing}
            className="btn-primary flex items-center gap-2"
          >
            {syncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Synchroniser
          </button>
        </div>
      </div>

      {/* Email list */}
      {emails.length === 0 ? (
        <div className="card text-center py-16 space-y-3">
          <Mail size={40} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
          <p style={{ color: "var(--text-muted)" }}>Aucun email traité. Cliquez sur Synchroniser.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => {
            const expanded = expandedId === email.id;
            const replying = replyingId === email.id;
            const catColor = CATEGORY_COLORS[email.category ?? "other"] ?? "#6b7280";

            return (
              <div key={email.id} className="card space-y-0 p-0 overflow-hidden">
                {/* Email header */}
                <button
                  className="w-full text-left p-4 hover:bg-white/3 transition-all"
                  onClick={() => setExpandedId(expanded ? null : email.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Category badge */}
                        <span className="badge text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${catColor}20`, color: catColor, border: `1px solid ${catColor}40` }}>
                          <Tag size={10} className="inline mr-1" />
                          {email.category ?? "autre"}
                        </span>
                        {/* Priority */}
                        {email.priority === "high" && (
                          <span className="badge text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                            ⚡ Urgent
                          </span>
                        )}
                        {/* Replied */}
                        {email.replied && (
                          <span className="badge text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                            <CheckCircle2 size={10} className="inline mr-1" />
                            Répondu
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-sm truncate">{email.subject ?? "(Sans sujet)"}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {email.from}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        <Clock size={10} className="inline mr-1" />
                        {new Date(email.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {/* Summary preview */}
                  {email.summary && !expanded && (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {email.summary}
                    </p>
                  )}
                </button>

                {/* Expanded content */}
                {expanded && (
                  <div className="border-t px-4 pb-4 space-y-4" style={{ borderColor: "var(--border)" }}>
                    {/* Summary */}
                    {email.summary && (
                      <div className="pt-4">
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Résumé IA</p>
                        <p className="text-sm">{email.summary}</p>
                      </div>
                    )}

                    {/* Original body */}
                    {email.body && (
                      <div>
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Message original</p>
                        <div className="text-xs p-3 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto"
                          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                          {email.body}
                        </div>
                      </div>
                    )}

                    {/* AI Reply suggestion */}
                    {email.aiReply && !email.replied && (
                      <div>
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Réponse suggérée par l'IA</p>
                        {!replying ? (
                          <div className="space-y-2">
                            <div className="text-sm p-3 rounded-lg whitespace-pre-wrap"
                              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                              {email.aiReply}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setReplyTexts((p) => ({ ...p, [email.id]: email.aiReply ?? "" }));
                                  setReplyingId(email.id);
                                }}
                                className="btn-primary text-xs flex items-center gap-1.5"
                              >
                                <Send size={12} />
                                Envoyer cette réponse
                              </button>
                              <button
                                onClick={() => {
                                  setReplyTexts((p) => ({ ...p, [email.id]: "" }));
                                  setReplyingId(email.id);
                                }}
                                className="btn-secondary text-xs"
                              >
                                Écrire ma réponse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              className="input w-full text-sm"
                              rows={6}
                              value={replyTexts[email.id] ?? ""}
                              onChange={(e) => setReplyTexts((p) => ({ ...p, [email.id]: e.target.value }))}
                              placeholder="Votre réponse..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendReply(email)}
                                disabled={sendingId === email.id}
                                className="btn-primary text-xs flex items-center gap-1.5"
                              >
                                {sendingId === email.id
                                  ? <Loader2 size={12} className="animate-spin" />
                                  : <Send size={12} />}
                                Envoyer
                              </button>
                              <button
                                onClick={() => setReplyingId(null)}
                                className="btn-secondary text-xs"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {email.replied && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#10b981" }}>
                        <CheckCircle2 size={14} />
                        Réponse envoyée
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
