"use client";

import Link from "next/link";
import {
  Mail, Bot, Send, FileText, BarChart3, TrendingUp, Inbox, CheckCircle2, ChevronRight, Lock, Plug, Sparkles, Loader2,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MonthlyStats, HistoryItem, formatDate, TYPE_COLORS } from "@/lib/email-utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pieFmt = (value: any, name: any) => [`${value} email${Number(value) > 1 ? "s" : ""}`, name];

export function EmailDashboardView({
  monthlyStats,
  history,
  isBlocked,
  gmailConnected,
  agentEnabled,
  onGenerateClick,
  syncing,
  onLoadReport,
}: {
  monthlyStats: MonthlyStats;
  history: HistoryItem[];
  isBlocked: boolean;
  gmailConnected: boolean;
  agentEnabled: boolean;
  onGenerateClick: () => void;
  syncing: boolean;
  onLoadReport: (id: string) => void;
}) {
  const donutData = [
    { name: "Prospect/Client", value: monthlyStats.typeBreakdown.prospectClient, color: TYPE_COLORS["Prospect/Client"].chart },
    { name: "Interne", value: monthlyStats.typeBreakdown.interne, color: TYPE_COLORS["Interne"].chart },
    { name: "Newsletter/Promo", value: monthlyStats.typeBreakdown.newsletterPromotion, color: TYPE_COLORS["Newsletter/Promotion"].chart },
    { name: "Information", value: monthlyStats.typeBreakdown.information, color: TYPE_COLORS["Information"].chart },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Email</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Compte rendu et réponses automatisées</p>
        </div>
        {isBlocked ? (
          <div className="flex items-center gap-3">
            {!gmailConnected && (
              <Link href="/dashboard/integrations" className="btn-primary inline-flex items-center gap-2">
                <Plug size={16} /> Connecter Gmail
              </Link>
            )}
            {gmailConnected && !agentEnabled && (
              <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
                <Bot size={16} /> Activer l&apos;agent
              </Link>
            )}
          </div>
        ) : (
          <button onClick={onGenerateClick} disabled={syncing} className="btn-primary inline-flex items-center gap-2">
            {syncing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {syncing ? "Récupération..." : "Générer un nouveau rapport"}
          </button>
        )}
      </div>

      {/* Blocked banner */}
      {isBlocked && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}>
          <Lock size={18} style={{ color: "#fbbf24" }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "#fbbf24" }}>
              {!gmailConnected ? "Gmail déconnecté" : "Agent Email désactivé"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {!gmailConnected
                ? "Reconnecte Gmail pour générer de nouveaux rapports. Tes données restent accessibles."
                : "Active l'agent Email depuis le tableau de bord pour reprendre la génération de rapports."}
            </p>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rapports ce mois</span>
            <FileText size={14} style={{ color: "var(--accent-light)" }} />
          </div>
          <div className="text-2xl font-bold">{monthlyStats.reportsCount}</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Emails traités</span>
            <Inbox size={14} style={{ color: "var(--accent-light)" }} />
          </div>
          <div className="text-2xl font-bold">{monthlyStats.totalEmails}</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Réponses suggérées</span>
            <CheckCircle2 size={14} style={{ color: "#10b981" }} />
          </div>
          <div className="text-2xl font-bold">{monthlyStats.typeBreakdown.needsReply}</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Crédits utilisés</span>
            <TrendingUp size={14} style={{ color: "#fbbf24" }} />
          </div>
          <div className="text-2xl font-bold">{monthlyStats.totalEmails}</div>
        </div>
      </div>

      {/* Stats + Chart row */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-sm">Répartition par type</h3>
          {donutData.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aucune donnée ce mois-ci</p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12, color: "#fff" }}
                      formatter={pieFmt}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold text-sm">À propos de l&apos;agent</h3>
          <div className="space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
            <p className="flex items-start gap-2">
              <Mail size={14} className="mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }} />
              Analyse les nouveaux emails depuis ta dernière génération de rapport (ou les 24 dernières heures si c&apos;est ta première fois)
            </p>
            <p className="flex items-start gap-2">
              <Bot size={14} className="mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }} />
              Classification automatique : Prospect, Interne, Newsletter, Info
            </p>
            <p className="flex items-start gap-2">
              <Send size={14} className="mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }} />
              Suggère des réponses pour les emails qui nécessitent une action
            </p>
            <p className="flex items-start gap-2">
              <BarChart3 size={14} className="mt-0.5 shrink-0" style={{ color: "var(--accent-light)" }} />
              1 email = 1 crédit IA
            </p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historique des rapports</h2>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{history.length} rapport{history.length > 1 ? "s" : ""}</span>
        </div>

        {history.length === 0 ? (
          <div className="card text-center py-12">
            <FileText size={32} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Aucun rapport pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {history.map((item) => {
              const typeBadges: { label: string; color: string; bg: string }[] = [];
              let replyCount = 0;
              try {
                const s = JSON.parse(item.stats) as { prospectClient?: number; interne?: number; newsletterPromotion?: number; information?: number; needsReply?: number };
                replyCount = s.needsReply ?? 0;
                if (s.prospectClient) typeBadges.push({ label: `${s.prospectClient} Prospect`, color: TYPE_COLORS["Prospect/Client"].text, bg: TYPE_COLORS["Prospect/Client"].bg });
                if (s.interne) typeBadges.push({ label: `${s.interne} Interne`, color: TYPE_COLORS["Interne"].text, bg: TYPE_COLORS["Interne"].bg });
                if (s.newsletterPromotion) typeBadges.push({ label: `${s.newsletterPromotion} Promo`, color: TYPE_COLORS["Newsletter/Promotion"].text, bg: TYPE_COLORS["Newsletter/Promotion"].bg });
                if (s.information) typeBadges.push({ label: `${s.information} Info`, color: TYPE_COLORS["Information"].text, bg: TYPE_COLORS["Information"].bg });
              } catch { /* ignore */ }
              return (
                <button
                  key={item.id}
                  onClick={() => onLoadReport(item.id)}
                  className="text-left card space-y-2 group transition-all hover:border-purple-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} style={{ color: "var(--accent-light)" }} />
                      <span className="text-sm font-medium">{item.totalEmails} email{item.totalEmails > 1 ? "s" : ""}</span>
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(item.createdAt)}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {item.totalEmails} email{item.totalEmails > 1 ? "s" : ""} analysé{item.totalEmails > 1 ? "s" : ""}
                    {replyCount > 0 ? ` • ${replyCount} réponse${replyCount > 1 ? "s" : ""} suggérée${replyCount > 1 ? "s" : ""}` : ""}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {typeBadges.map((b) => (
                      <span key={b.label} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: b.bg, color: b.color }}>{b.label}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{item.period}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent-light)" }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
