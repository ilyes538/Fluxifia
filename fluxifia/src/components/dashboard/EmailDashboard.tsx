"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Loader2, Sparkles, Eye, ArrowLeft, AlertCircle, ChevronDown } from "lucide-react";
import { EmailLandingPage } from "./email/EmailLandingPage";
import { EmailDashboardView } from "./email/EmailDashboardView";
import { EmailSelection } from "./email/EmailSelection";
import { EmailReportView } from "./email/EmailReportView";
import type { MonthlyStats, HistoryItem, ReportDocument, SyncResponse } from "@/lib/email-utils";

export function EmailDashboard({
  gmailConnected,
  agentEnabled,
  monthlyStats,
  history,
  gmailAccounts,
}: {
  gmailConnected: boolean;
  agentEnabled: boolean;
  monthlyStats: MonthlyStats;
  history: HistoryItem[];
  gmailAccounts: string[];
}) {
  const [view, setView] = useState<"dashboard" | "fetched" | "details" | "generating" | "report">("dashboard");
  const [count, setCount] = useState(0);
  const [preview, setPreview] = useState<Parameters<typeof EmailSelection>[0]["preview"]>([]);
  const [messages, setMessages] = useState<import("@/lib/email-utils").FetchedMessage[]>([]);
  const [report, setReport] = useState<ReportDocument | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasHistory = history.length > 0;
  const isBlocked = !gmailConnected || !agentEnabled;

  // Filter history & stats by selected account
  const filteredHistory = useMemo(() => {
    if (selectedAccount === "all") return history;
    return history.filter((h) => h.gmailEmail === selectedAccount);
  }, [history, selectedAccount]);

  const filteredStats = useMemo<MonthlyStats>(() => {
    if (selectedAccount === "all") return monthlyStats;
    const reports = filteredHistory;
    let totalEmails = 0;
    const typeBreakdown = {
      prospectClient: 0,
      interne: 0,
      newsletterPromotion: 0,
      information: 0,
      needsReply: 0,
    };
    for (const r of reports) {
      totalEmails += r.totalEmails;
      try {
        const stats = JSON.parse(r.stats) as {
          prospectClient?: number;
          interne?: number;
          newsletterPromotion?: number;
          information?: number;
          needsReply?: number;
        };
        typeBreakdown.prospectClient += stats.prospectClient ?? 0;
        typeBreakdown.interne += stats.interne ?? 0;
        typeBreakdown.newsletterPromotion += stats.newsletterPromotion ?? 0;
        typeBreakdown.information += stats.information ?? 0;
        typeBreakdown.needsReply += stats.needsReply ?? 0;
      } catch { /* ignore */ }
    }
    return { reportsCount: reports.length, totalEmails, typeBreakdown };
  }, [filteredHistory, monthlyStats, selectedAccount]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/email/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de la récupération");
        setSyncing(false);
        return;
      }
      setCount(data.count);
      setPreview(data.preview);
      setMessages(data.messages);
      setSelectedIds(new Set(data.messages.map((m) => m.gmailId)));
      setReport(null);
      setView("fetched");
    } catch {
      setError("Erreur réseau");
    } finally {
      setSyncing(false);
    }
  }, []);

  async function handleGenerate() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setError("Sélectionnez au moins un email");
      return;
    }
    setView("generating");
    setError(null);
    try {
      const res = await fetch("/api/email/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, selectedIds: ids }),
      });
      const data = await res.json() as {
        document?: ReportDocument;
        reportId?: string;
        warning?: string;
        error?: string;
      };
      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors de la génération");
        setView("fetched");
        return;
      }
      if (data.warning) setError(data.warning);
      if (data.document) {
        setReport(data.document);
        setView("report");
      }
    } catch {
      setError("Erreur réseau");
      setView("fetched");
    }
  }

  async function loadReport(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json() as ReportDocument & { error?: string };
      if (!res.ok || data.error) {
        setError(data.error || "Erreur lors du chargement du compte rendu");
        return;
      }
      setReport(data);
      setView("report");
    } catch {
      setError("Erreur réseau");
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Landing page for new users who never used the agent and are blocked
  if (!hasHistory && isBlocked) {
    return <EmailLandingPage />;
  }

  // Dashboard view
  if (view === "dashboard") {
    return (
      <>
        {gmailAccounts.length > 1 && (
          <div className="mb-6" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 text-lg font-semibold hover:text-white transition-colors"
              style={{ color: "var(--accent-light)" }}
            >
              {selectedAccount === "all" ? "Général" : selectedAccount}
              <ChevronDown
                size={18}
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className="mt-2 space-y-1.5 overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: dropdownOpen ? "200px" : "0px",
                opacity: dropdownOpen ? 1 : 0,
                transform: dropdownOpen ? "translateY(0)" : "translateY(-6px)",
              }}
            >
              {selectedAccount !== "all" && (
                <button
                  onClick={() => { setSelectedAccount("all"); setDropdownOpen(false); }}
                  className="block text-base text-white/80 transition-all duration-200 hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                >
                  Général
                </button>
              )}
              {gmailAccounts
                .filter((email) => email !== selectedAccount)
                .map((email) => (
                  <button
                    key={email}
                    onClick={() => { setSelectedAccount(email); setDropdownOpen(false); }}
                    className="block text-base text-white/80 transition-all duration-200 hover:text-white hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]"
                  >
                    {email}
                  </button>
                ))}
            </div>
          </div>
        )}
        <EmailDashboardView
          monthlyStats={filteredStats}
          history={filteredHistory}
          isBlocked={isBlocked}
          gmailConnected={gmailConnected}
          agentEnabled={agentEnabled}
          onGenerateClick={handleSync}
          syncing={syncing}
          onLoadReport={loadReport}
        />
      </>
    );
  }

  // Fetched
  if (view === "fetched") {
    return (
      <div className="max-w-xl mx-auto mt-16 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Résultat de la récupération</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Voici ce qui a été trouvé dans votre boîte Gmail.</p>
        </div>

        {error && <div className="flex items-center gap-2 justify-center text-sm text-red-400"><AlertCircle size={14} /> {error}</div>}

        <div className="card text-center space-y-4">
          <div className="space-y-1">
            <div className="text-5xl font-bold gradient-text">{count}</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{count === 1 ? "email trouvé" : "emails trouvés"}</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="badge badge-violet"><Sparkles size={10} /> {count} crédit{count > 1 ? "s" : ""} nécessaire{count > 1 ? "s" : ""}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button onClick={() => setView("details")} className="btn-secondary flex items-center justify-center gap-2 flex-1"><Eye size={14} /> Voir les détails</button>
            <button onClick={handleGenerate} disabled={count === 0} className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"><Sparkles size={14} /> Générer le compte rendu</button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button onClick={handleSync} disabled={syncing} className="text-sm inline-flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}>
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <>{/* refresh icon handled by text */}</>}
            {syncing ? "Actualisation..." : "Relancer la récupération"}
          </button>
          <button onClick={() => setView("dashboard")} className="text-sm inline-flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: "var(--text-muted)" }}><ArrowLeft size={12} /> Retour</button>
        </div>
      </div>
    );
  }

  // Generating
  if (view === "generating") {
    return (
      <div className="max-w-xl mx-auto mt-24 text-center space-y-6">
        <Loader2 size={48} className="animate-spin" style={{ color: "var(--accent-light)", margin: "0 auto" }} />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Génération en cours...</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>L&apos;IA analyse vos {count} email{count > 1 ? "s" : ""}.<br />Cela peut prendre quelques instants.</p>
        </div>
      </div>
    );
  }

  // Report
  if (view === "report" && report) {
    return <EmailReportView report={report} onBack={() => setView("dashboard")} />;
  }

  // Details / Selection
  return (
    <EmailSelection
      preview={preview}
      count={count}
      selectedIds={selectedIds}
      onToggle={toggleSelect}
      onSelectAll={() => setSelectedIds(new Set(preview.map((e) => e.gmailId)))}
      onDeselectAll={() => setSelectedIds(new Set())}
      onGenerate={handleGenerate}
      onBack={() => setView("fetched")}
    />
  );
}
