import Link from "next/link";
import {
  Bot, Mail, Slack, BookOpen, Calendar, Users, Check, ArrowRight,
  Zap, Shield, BarChart3, Star,
} from "lucide-react";
import { PLANS } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ borderColor: "var(--border)", background: "rgba(9,9,15,0.8)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Bot size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--text)" }}>SortAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm" style={{ color: "var(--text-muted)" }}>Fonctionnalités</a>
            <a href="#pricing" className="text-sm" style={{ color: "var(--text-muted)" }}>Tarifs</a>
            <a href="#agents" className="text-sm" style={{ color: "var(--text-muted)" }}>Agents IA</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm">Connexion</Link>
            <Link href="/auth/register" className="btn-primary text-sm">Démarrer gratuitement</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="hero-glow top-0 left-1/4 -translate-x-1/2" style={{ position: "absolute" }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="badge badge-violet inline-flex mb-6">
            <Zap size={12} />
            Propulsé par Claude · Anthropic
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Des agents IA qui{" "}
            <span className="gradient-text">travaillent pour vous</span>
          </h1>
          <p className="text-xl mb-10 max-w-2xl mx-auto" style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
            Connectez vos outils, activez vos agents IA et automatisez les tâches répétitives de votre PME.
            Gmail, Outlook, Slack, Notion — tout en un seul endroit.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-primary flex items-center gap-2 justify-center text-base px-8 py-3">
              Démarrer gratuitement <ArrowRight size={16} />
            </Link>
            <Link href="#pricing" className="btn-secondary flex items-center gap-2 justify-center text-base px-8 py-3">
              Voir les tarifs
            </Link>
          </div>
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Aucune carte bancaire requise · Gratuit jusqu&apos;à 100 emails/mois
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <div className="w-3 h-3 rounded-full bg-red-500/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <div className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>fluxifia.com/dashboard</span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4">
              {[
                { label: "Emails traités", value: "1 284", trend: "+12%", icon: Mail },
                { label: "Agents actifs", value: "5 / 10", trend: "running", icon: Bot },
                { label: "Temps économisé", value: "34h", trend: "ce mois", icon: BarChart3 },
              ].map((stat) => (
                <div key={stat.label} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</span>
                    <stat.icon size={14} style={{ color: "var(--accent-light)" }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{stat.value}</div>
                  <div className="text-xs mt-1" style={{ color: "var(--green)" }}>{stat.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tout ce dont votre PME a besoin</h2>
            <p className="text-lg" style={{ color: "var(--text-muted)" }}>Des agents IA spécialisés pour chaque aspect de votre activité</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Mail,
                title: "Agent Email",
                desc: "Catégorise, priorise et répond automatiquement à vos emails. Détecte les urgences et redirige vers le bon service.",
                tags: ["Gmail", "Outlook"],
              },
              {
                icon: Slack,
                title: "Agent Slack",
                desc: "Répond aux questions des collaborateurs, résume les fils de discussion et notifie les bonnes personnes.",
                tags: ["Slack"],
              },
              {
                icon: BookOpen,
                title: "Agent Notion",
                desc: "Met à jour vos pages, crée des comptes-rendus de réunion et organise votre base de connaissances.",
                tags: ["Notion"],
              },
              {
                icon: Calendar,
                title: "Agent Agenda",
                desc: "Planifie vos réunions, envoie des rappels et optimise votre emploi du temps automatiquement.",
                tags: ["Google Calendar", "Outlook Calendar"],
              },
              {
                icon: Users,
                title: "Agent Lead",
                desc: "Qualifie vos prospects entrants, score leur potentiel et déclenche les bonnes actions commerciales.",
                tags: ["CRM", "Email"],
              },
              {
                icon: Shield,
                title: "Agent Support",
                desc: "Traite les demandes clients, suggère des solutions et escalade les cas complexes vers votre équipe.",
                tags: ["Email", "Ticket"],
              },
            ].map((feature) => (
              <div key={feature.title} className="card hover:border-purple-500/30 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "var(--accent-glow)" }}>
                  <feature.icon size={18} style={{ color: "var(--accent-light)" }} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm mb-4" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>{feature.desc}</p>
                <div className="flex gap-2 flex-wrap">
                  {feature.tags.map((t) => (
                    <span key={t} className="badge badge-gray">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="agents" className="py-16 px-6" style={{ background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Intégrations natives</h2>
          <p className="mb-12" style={{ color: "var(--text-muted)" }}>Connectez vos outils en quelques clics, sans code</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Gmail", color: "#EA4335" },
              { name: "Outlook", color: "#0078D4" },
              { name: "Slack", color: "#4A154B" },
              { name: "Notion", color: "#ffffff" },
            ].map((int) => (
              <div key={int.name} className="card flex items-center gap-3 hover:border-white/20">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: int.color === "#ffffff" ? "#1e1e1e" : int.color + "20", color: int.color, border: `1px solid ${int.color}30` }}>
                  {int.name[0]}
                </div>
                <span className="font-medium">{int.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p style={{ color: "var(--text-muted)" }}>Commencez gratuitement, évoluez selon vos besoins</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
              const isPro = key === "pro";
              return (
                <div key={key} className={`card flex flex-col relative ${isPro ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : ""}`}>
                  {isPro && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="badge badge-violet flex items-center gap-1">
                        <Star size={10} fill="currentColor" /> Populaire
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? "0€" : `${plan.price / 100}€`}
                      </span>
                      {plan.price > 0 && <span style={{ color: "var(--text-muted)" }}>/mois</span>}
                    </div>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--green)" }} />
                        <span style={{ color: "var(--text-muted)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className={isPro ? "btn-primary text-center text-sm" : "btn-secondary text-center text-sm"}
                  >
                    {plan.price === 0 ? "Démarrer gratuitement" : "Choisir ce plan"}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Bot size={12} className="text-white" />
            </div>
            <span className="font-bold">SortAI</span>
          </div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © 2025 SortAI Media. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/legal">Mentions légales</Link>
            <Link href="/privacy">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
