import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  MessageSquare,
  Plug,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { PLANS } from "@/lib/utils";

const agents = [
  {
    icon: Mail,
    name: "Agent Email",
    copy: "Classe les messages entrants, isole les urgences et prépare des réponses prêtes à relire.",
    meta: "Gmail, Outlook",
  },
  {
    icon: MessageSquare,
    name: "Agent Slack",
    copy: "Résume les fils importants, répond aux questions répétitives et prévient les bonnes personnes.",
    meta: "À venir",
    soon: true,
  },
  {
    icon: Calendar,
    name: "Agent Agenda",
    copy: "Prépare les rappels, détecte les demandes de rendez-vous et fluidifie la planification.",
    meta: "Calendriers",
  },
  {
    icon: Users,
    name: "Agent Lead",
    copy: "Qualifie les prospects, extrait le contexte utile et priorise les opportunités commerciales.",
    meta: "CRM, email",
  },
];

const workflow = [
  "Connexion sécurisée aux outils de l'équipe",
  "Analyse et classification par agent spécialisé",
  "Actions suggérées avec historique et suivi des crédits",
];

const pricingPlans = (Object.entries(PLANS) as [string, (typeof PLANS)[keyof typeof PLANS]][]).filter(
  ([key]) => key !== "free"
);

const creditRules = [
  { icon: Mail, label: "1 mail analysé", cost: "1 crédit" },
  { icon: Calendar, label: "1 événement agenda", cost: "1 crédit" },
  { icon: Users, label: "1 lead qualifié", cost: "1 crédit" },
  { icon: MessageSquare, label: "Slack", cost: "À venir" },
];

function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/F_logo.png"
        alt="Fluxifia"
        width={compact ? 34 : 46}
        height={compact ? 34 : 46}
        className="rounded-lg"
        priority
      />
      <div className={compact ? "hidden sm:block" : ""}>
        <div className="text-sm font-semibold leading-none text-white">Fluxifia</div>
        <div className="mt-1 text-[11px] leading-none" style={{ color: "var(--text-muted)" }}>
          SortAI agents
        </div>
      </div>
    </div>
  );
}

function ProductScene() {
  return (
    <div className="relative z-10 mx-auto mt-16 w-full max-w-[980px] px-0 sm:px-6" aria-hidden="true">
        <div
          className="overflow-hidden rounded-2xl border shadow-2xl"
          style={{
            background: "rgba(17,17,24,0.82)",
            borderColor: "rgba(255,255,255,0.1)",
            boxShadow: "0 40px 140px rgba(0,0,0,0.65), 0 0 90px rgba(124,58,237,0.14)",
          }}
        >
          <div
            className="flex h-10 items-center gap-2 border-b px-4"
            style={{ borderColor: "var(--border)", background: "rgba(14,14,20,0.88)" }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
            <span className="ml-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
              app.fluxifia.ai/dashboard
            </span>
          </div>

          <div className="grid min-h-[430px] grid-cols-[210px_1fr]">
            <aside className="hidden border-r p-4 md:block" style={{ borderColor: "var(--border)" }}>
              <LogoMark compact />
              <div className="mt-8 space-y-2">
                {["Vue d'ensemble", "Agent Email", "Intégrations", "Utilisation"].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: index === 1 ? "var(--accent-glow)" : "transparent",
                      color: index === 1 ? "var(--accent-light)" : "var(--text-muted)",
                    }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {item}
                  </div>
                ))}
              </div>
            </aside>

            <div className="p-4 md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Tableau de bord
                  </div>
                  <div className="mt-1 text-xl font-bold text-white">Agent Email actif</div>
                </div>
                <div className="rounded-full px-3 py-1 text-xs" style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}>
                  En cours
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Emails traités", "1 284", "+12%"],
                  ["Temps économisé", "34 h", "ce mois"],
                  ["Crédits utilisés", "48", "suivi"],
                ].map(([label, value, trend]) => (
                  <div key={label} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.035)" }}>
                    <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-white">{value}</div>
                    <div className="mt-1 text-[11px]" style={{ color: "#4ade80" }}>
                      {trend}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-white">Messages prioritaires</span>
                    <Sparkles size={14} style={{ color: "var(--accent-light)" }} />
                  </div>
                  {[
                    ["Devis urgent - refonte CRM", "Prospect", "#60a5fa"],
                    ["Relance facture avril", "Interne", "#34d399"],
                    ["Demande support compte", "Support", "#fbbf24"],
                  ].map(([subject, tag, color]) => (
                    <div key={subject} className="mb-2 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(9,9,15,0.58)" }}>
                      <span className="truncate text-xs text-white">{subject}</span>
                      <span className="ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${color}22`, color }}>
                        {tag}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.03)" }}>
                  <div className="mb-4 text-xs font-medium text-white">Agents connectés</div>
                  {[
                    ["Gmail", "Actif"],
                    ["Slack", "À venir"],
                    ["Notion", "Prêt"],
                  ].map(([name, state]) => (
                    <div key={name} className="mb-3 flex items-center justify-between text-xs">
                      <span style={{ color: "var(--text-muted)" }}>{name}</span>
                      <span className="text-white">{state}</span>
                    </div>
                  ))}
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 rounded-full" style={{ background: "linear-gradient(90deg,#7c3aed,#22c55e)" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <nav
        className="fixed left-0 right-0 top-0 z-50 border-b"
        style={{ borderColor: "var(--border)", background: "rgba(9,9,15,0.78)", backdropFilter: "blur(14px)" }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Accueil Fluxifia">
            <LogoMark compact />
          </Link>
          <div className="hidden items-center gap-7 text-sm md:flex" style={{ color: "var(--text-muted)" }}>
            <a href="#agents" className="transition hover:text-white">Agents</a>
            <a href="#workflow" className="transition hover:text-white">Méthode</a>
            <a href="#pricing" className="transition hover:text-white">Tarifs</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-secondary px-3 text-sm sm:px-5">
              Connexion
            </Link>
            <Link href="/auth/register" className="btn-primary hidden text-sm sm:inline-flex">
              Voir les plans
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-20 pt-28 sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.22),transparent_38%),linear-gradient(180deg,rgba(9,9,15,0.2),#09090f_88%)]"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="badge badge-violet mb-5">
            <Zap size={12} />
            Agents IA pour PME opérationnelles
          </div>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Fluxifia automatise les emails, les suivis et les tâches répétitives.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg" style={{ color: "var(--text-muted)" }}>
            Connectez vos outils, activez vos agents et gardez le contrôle depuis un tableau de bord clair.
            SortAI traite l'information entrante, propose les prochaines actions et suit l'usage de chaque équipe.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth/register" className="btn-primary inline-flex items-center justify-center gap-2 px-7 py-3 text-base">
              Choisir un plan <ArrowRight size={17} />
            </Link>
            <a href="#agents" className="btn-secondary inline-flex items-center justify-center gap-2 px-7 py-3 text-base">
              Voir les agents
            </a>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} /> Sans conservation des mails</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Connexions OAuth</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Mise en route en quelques minutes</span>
          </div>
        </div>
        <ProductScene />
      </section>

      <section id="agents" className="relative px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="badge badge-gray mb-3">
                <Bot size={12} />
                Catalogue d'agents
              </div>
              <h2 className="text-3xl font-bold text-white">Des assistants spécialisés, pas un chatbot générique.</h2>
            </div>
            <p className="max-w-md text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              Chaque agent correspond à un flux de travail concret : email, support, messages internes, leads ou agenda.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent) => (
              <article key={agent.name} className="card transition hover:border-purple-500/30">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "var(--accent-glow)" }}>
                  <agent.icon size={18} style={{ color: "var(--accent-light)" }} />
                </div>
                <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                <p className="mt-3 min-h-20 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  {agent.copy}
                </p>
                <div className={agent.soon ? "badge badge-yellow mt-5" : "badge badge-gray mt-5"}>
                  {agent.meta}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="border-y px-4 py-20 sm:px-6" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="badge badge-violet mb-4">
              <Plug size={12} />
              Mise en place
            </div>
            <h2 className="text-3xl font-bold text-white">Un déploiement simple, pensé pour rester lisible.</h2>
            <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              L'interface reprend les codes du dashboard : actions courtes, statuts visibles, limites transparentes et
              intégrations au même endroit.
            </p>
          </div>

          <div className="grid gap-3">
            {workflow.map((item, index) => (
              <div key={item} className="flex items-center gap-4 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.035)" }}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold" style={{ background: "var(--accent-glow)", color: "var(--accent-light)" }}>
                  {index + 1}
                </div>
                <div className="font-medium text-white">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="badge badge-green mb-4">
              <ShieldCheck size={12} />
              Confidentialité
            </div>
            <h2 className="text-3xl font-bold text-white">Votre confidentialité est essentielle.</h2>
            <p className="mt-4 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              Les mails ne sont pas conservés dans Fluxifia. Ils sont uniquement lus le temps de l'analyse,
              résumés, filtrés, puis transformés en informations exploitables dans votre espace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Pas de stockage du contenu email", "Résumé et filtrage uniquement", "Accès sécurisé par OAuth"].map((item) => (
              <div key={item} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.035)" }}>
                <CheckCircle2 size={17} style={{ color: "var(--green)" }} />
                <p className="mt-3 text-sm font-medium text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <div className="badge badge-gray mb-3">
              <BarChart3 size={12} />
              Tarifs
            </div>
            <h2 className="text-3xl font-bold text-white">Des packs de crédits simples, pensés pour rendre Scale évident.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              Le plan Scale donne 5x plus de crédits que l'Essentiel pour environ 2,25x le prix.
              C'est le meilleur coût par action dès que le volume devient régulier.
            </p>
          </div>

          <div className="mb-8 grid gap-3 md:grid-cols-4">
            {creditRules.map((rule) => (
              <div key={rule.label} className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.035)" }}>
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--accent-glow)" }}>
                  <rule.icon size={16} style={{ color: "var(--accent-light)" }} />
                </div>
                <p className="text-sm font-medium text-white">{rule.label}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{rule.cost}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {pricingPlans.map(([key, plan]) => {
              const isScale = key === "enterprise";
              return (
                <article
                  key={key}
                  className="card relative flex min-h-[410px] flex-col"
                  style={isScale ? { borderColor: "rgba(168,85,247,0.65)", boxShadow: "0 0 55px rgba(124,58,237,0.16)" } : undefined}
                >
                  {isScale && (
                    <span className="badge badge-violet absolute -top-3 left-5">
                      <Star size={10} fill="currentColor" />
                      Meilleure valeur
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="mt-4 flex items-end gap-1">
                    <span className="text-3xl font-bold text-white">
                      {(plan.price / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                    </span>
                    <span className="pb-1 text-sm" style={{ color: "var(--text-muted)" }}>/mois</span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    Annuel : {(plan.annualPrice / 100).toLocaleString("fr-FR")} € / an, soit 2 mois offerts.
                  </p>
                  <div className="badge badge-violet mt-5 w-fit">
                    {plan.emails.toLocaleString("fr-FR")} crédits/mois
                  </div>
                  <ul className="mt-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2 text-sm leading-5" style={{ color: "var(--text-muted)" }}>
                        <Check size={15} className="mt-0.5 shrink-0" style={{ color: "var(--green)" }} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth/register" className={isScale ? "btn-primary mt-7 text-center text-sm" : "btn-secondary mt-7 text-center text-sm"}>
                    Choisir {plan.name}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-10 sm:px-6" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <LogoMark compact />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © 2026 Fluxifia. Agents IA et automatisation pour les PME.
          </p>
          <div className="flex gap-5 text-sm" style={{ color: "var(--text-muted)" }}>
            <Link href="/auth/login" className="hover:text-white">Connexion</Link>
            <Link href="/auth/register" className="hover:text-white">Créer un compte</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
