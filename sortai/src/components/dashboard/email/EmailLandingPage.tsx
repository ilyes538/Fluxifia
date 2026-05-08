"use client";

import Link from "next/link";
import { Mail, Plug, BarChart3, CheckCircle2, Sparkles, Bot, Send } from "lucide-react";
import { MockupBrowser } from "./MockupBrowser";

function DashboardMockup() {
  return (
    <MockupBrowser>
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          {["Rapports ce mois", "Emails traités", "Crédits utilisés"].map((label, i) => (
            <div key={label} className="flex-1 rounded-lg p-3 space-y-2" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</div>
              <div className="text-xl font-bold">{[12, 48, 48][i]}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>Répartition par type</div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4" style={{ borderColor: "#3b82f6", borderRightColor: "transparent", transform: "rotate(45deg)" }} />
            <div className="space-y-1">
              {["#3b82f6 Prospect", "#10b981 Interne", "#8b5cf6 Promo"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.split(" ")[0] }} />
                  <span className="text-[10px]">{item.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MockupBrowser>
  );
}

function SelectionMockup() {
  return (
    <MockupBrowser>
      <div className="p-4 space-y-2">
        {[
          { name: "Marie Lefebvre", subj: "Re: Réunion de lundi", date: "08 mai, 11:33", checked: true, grad: "linear-gradient(135deg, #3b82f6, #06b6d4)", initial: "M" },
          { name: "Paul Martin", subj: "Nouvelle commande #4521", date: "07 mai, 16:20", checked: false, grad: "linear-gradient(135deg, #ec4899, #f43f5e)", initial: "P" },
          { name: "Sophie Bernard", subj: "Newsletter mensuelle", date: "05 mai, 14:42", checked: false, grad: "linear-gradient(135deg, #10b981, #34d399)", initial: "S" },
        ].map((row) => (
          <div key={row.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={row.checked ? { background: "rgba(124,58,237,0.08)" } : undefined}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center ${row.checked ? "" : "border"}`} style={row.checked ? { background: "#7c3aed" } : { borderColor: "rgba(255,255,255,0.2)" }}>
              {row.checked && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              )}
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: row.grad }}>{row.initial}</div>
            <div className="flex-1"><div className="text-[10px] font-medium">{row.name}</div><div className="text-[8px]" style={{ color: "var(--text-muted)" }}>{row.subj}</div></div>
            <span className="text-[8px]" style={{ color: "var(--text-muted)" }}>{row.date}</span>
          </div>
        ))}
      </div>
    </MockupBrowser>
  );
}

function ReportMockup() {
  return (
    <MockupBrowser>
      <div className="p-4 space-y-3">
        <div className="flex gap-1.5 flex-wrap">
          {[
            { label: "3 Prospect", bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
            { label: "2 Interne", bg: "rgba(16,185,129,0.15)", color: "#34d399" },
            { label: "1 Promo", bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
          ].map((b) => (
            <span key={b.label} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: b.bg, color: b.color }}>{b.label}</span>
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg p-2.5 space-y-1.5" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>J</div>
                  <span className="text-[10px] font-medium">Jean Dupont</span>
                </div>
                <span className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>Prospect</span>
              </div>
              <div className="rounded p-1.5" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>Demande de devis pour un projet de...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MockupBrowser>
  );
}

export function EmailLandingPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 pb-12">
      {/* Hero */}
      <div className="text-center space-y-6 pt-8">
        <div className="relative inline-flex">
          <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: "var(--accent)" }} />
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
            <Mail size={32} className="text-white" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Agent Email</h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
            Ne perds plus de temps dans ta boîte mail. L&apos;IA analyse, classe et te propose des réponses en quelques secondes.
          </p>
        </div>
        <Link href="/dashboard/integrations" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
          <Plug size={18} /> Connecter Gmail
        </Link>
      </div>

      {/* Feature 1 — Dashboard */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
            <BarChart3 size={12} /> Tableau de bord
          </div>
          <h2 className="text-2xl font-bold">Tes stats en un coup d&apos;œil</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Visualise le nombre de rapports générés, d&apos;emails traités et la répartition par type (Prospect, Interne, Newsletter, Info). Tout est là, clair et synthétique.
          </p>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Suivi mensuel des crédits utilisés</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Répartition par type d&apos;email</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Historique complet des rapports</p>
          </div>
        </div>
        <DashboardMockup />
      </div>

      {/* Feature 2 — Selection */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1"><SelectionMockup /></div>
        <div className="space-y-4 order-1 md:order-2">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
            <CheckCircle2 size={12} /> Sélection intelligente
          </div>
          <h2 className="text-2xl font-bold">Tu choisis, l&apos;IA fait le reste</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Récupère tes nouveaux emails depuis ta dernière analyse et sélectionne ceux que tu veux traiter. Un email = un crédit. Pas de surprise.
          </p>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Sélection par lot ou un par un</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Visualisation rapide (expéditeur, sujet, date)</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Vérification des crédits avant génération</p>
          </div>
        </div>
      </div>

      {/* Feature 3 — Report */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}>
            <Sparkles size={12} /> Compte rendu IA
          </div>
          <h2 className="text-2xl font-bold">Un rapport structuré en secondes</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Pour chaque email analysé, l&apos;IA te donne : le type, un résumé concis et une réponse suggérée si action est requise. Tu n&apos;as plus qu&apos;à copier-coller ou personnaliser.
          </p>
          <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Classification automatique (4 types)</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Résumé en 1-2 phrases</p>
            <p className="flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--accent-light)" }} /> Réponse suggérée professionnelle</p>
          </div>
        </div>
        <ReportMockup />
      </div>

      {/* CTA bottom */}
      <div className="text-center pt-8">
        <Link href="/dashboard/integrations" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
          <Plug size={18} /> Connecter Gmail et commencer
        </Link>
      </div>
    </div>
  );
}
