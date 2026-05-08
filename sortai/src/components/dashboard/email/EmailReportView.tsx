"use client";

import { ArrowLeft, Bot, Send } from "lucide-react";
import { ReportDocument, parseSender, TYPE_COLORS } from "@/lib/email-utils";

export function EmailReportView({ report, onBack }: { report: ReportDocument; onBack: () => void }) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Compte rendu généré</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{report.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="badge" style={{ background: TYPE_COLORS["Prospect/Client"].bg, color: TYPE_COLORS["Prospect/Client"].text }}>
          {report.stats.prospectClient} Prospect/Client
        </span>
        <span className="badge" style={{ background: TYPE_COLORS["Interne"].bg, color: TYPE_COLORS["Interne"].text }}>
          {report.stats.interne} Interne
        </span>
        <span className="badge" style={{ background: TYPE_COLORS["Newsletter/Promotion"].bg, color: TYPE_COLORS["Newsletter/Promotion"].text }}>
          {report.stats.newsletterPromotion} Promo
        </span>
        <span className="badge" style={{ background: TYPE_COLORS["Information"].bg, color: TYPE_COLORS["Information"].text }}>
          {report.stats.information} Info
        </span>
        {report.stats.needsReply > 0 && (
          <span className="badge badge-yellow">
            <Send size={10} /> {report.stats.needsReply} réponse{report.stats.needsReply > 1 ? "s" : ""} suggérée{report.stats.needsReply > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {report.emails.map((email) => {
          const sender = parseSender(email.from);
          const colors = TYPE_COLORS[email.type] ?? TYPE_COLORS["Information"];
          return (
            <div key={email.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                    {sender.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sender.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{email.subject || "(Sans sujet)"}</p>
                  </div>
                </div>
                <span className="badge shrink-0" style={{ background: colors.bg, color: colors.text }}>{email.type}</span>
              </div>

              <div className="p-3 rounded-lg" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <p className="text-xs font-semibold uppercase mb-1 flex items-center gap-1" style={{ color: "var(--accent-light)" }}>
                  <Bot size={12} /> Résumé
                </p>
                <p className="text-sm">{email.summary}</p>
              </div>

              {email.draftAnswer && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <p className="text-xs font-semibold uppercase mb-1 flex items-center gap-1" style={{ color: "var(--green)" }}>
                    <Send size={12} /> Réponse suggérée
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{email.draftAnswer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
