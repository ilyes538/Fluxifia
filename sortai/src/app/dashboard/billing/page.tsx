import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLANS, formatDate, formatCurrency } from "@/lib/utils";
import { Check, CreditCard, AlertCircle, ExternalLink } from "lucide-react";
import { BillingActions } from "@/components/dashboard/BillingActions";

export const metadata = { title: "Abonnement" };

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  const orgId = session!.user.orgId;

  const sub = orgId
    ? await prisma.subscription.findUnique({ where: { orgId } })
    : null;

  const currentPlan = (sub?.plan as keyof typeof PLANS) ?? "free";
  const plan = PLANS[currentPlan];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Gérez votre plan et vos informations de facturation
        </p>
      </div>

      {/* Current plan */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Plan actuel</p>
            <h2 className="text-2xl font-bold mt-1">{plan.name}</h2>
            <div className="flex items-center gap-4 mt-2">
              <span className={`badge ${sub?.status === "active" ? "badge-green" : "badge-yellow"}`}>
                {sub?.status ?? "actif"}
              </span>
              {sub?.currentPeriodEnd && (
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Renouvellement le {formatDate(sub.currentPeriodEnd)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {plan.price === 0 ? "Gratuit" : formatCurrency(plan.price)}
            </div>
            {plan.price > 0 && <div className="text-sm" style={{ color: "var(--text-muted)" }}>/mois</div>}
          </div>
        </div>

        {sub?.cancelAtPeriodEnd && (
          <div className="mt-4 flex items-center gap-2 py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)" }}>
            <AlertCircle size={14} style={{ color: "#f87171" }} />
            <p className="text-sm" style={{ color: "#f87171" }}>
              Votre abonnement sera annulé le {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "bientôt"}.
            </p>
          </div>
        )}

        <BillingActions
          plan={currentPlan}
          hasStripe={!!sub?.stripeCustomerId}
          orgId={orgId ?? ""}
          userEmail={session!.user.email}
          orgName={session!.user.orgName ?? ""}
        />
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Changer de plan</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(PLANS).filter(([key]) => key !== "free") as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, p]) => {
            const isCurrent = key === currentPlan;
            return (
              <div key={key} className={`card flex flex-col relative ${isCurrent ? "border-purple-500/50" : ""}`}>
                {isCurrent && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="badge badge-violet text-xs">Plan actuel</span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {p.price === 0 ? "0€" : `${p.price / 100}€`}
                    </span>
                    {p.price > 0 && <span className="text-xs" style={{ color: "var(--text-muted)" }}>/mois</span>}
                  </div>
                  {p.annualPrice > 0 && (
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Annuel : {p.annualPrice / 100}€ / an
                    </p>
                  )}
                </div>
                <ul className="space-y-2 flex-1 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: "var(--green)" }} />
                      <span style={{ color: "var(--text-muted)" }}>{f}</span>
                    </li>
                  ))}
                </ul>
                {!isCurrent && key !== "free" && (
                  <BillingActions
                    plan={currentPlan}
                    targetPlan={key}
                    hasStripe={!!sub?.stripeCustomerId}
                    orgId={orgId ?? ""}
                    userEmail={session!.user.email}
                    orgName={session!.user.orgName ?? ""}
                    compact
                  />
                )}
                {isCurrent && (
                  <div className="btn-secondary text-xs text-center opacity-50 cursor-not-allowed">Plan actuel</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice history */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CreditCard size={16} style={{ color: "var(--accent-light)" }} />
            Historique de facturation
          </h2>
          {sub?.stripeCustomerId && (
            <form action="/api/billing/portal" method="POST">
              <input type="hidden" name="orgId" value={orgId ?? ""} />
              <button type="submit" className="btn-secondary text-xs flex items-center gap-1">
                Portail Stripe <ExternalLink size={11} />
              </button>
            </form>
          )}
        </div>
        {!sub?.stripeCustomerId ? (
          <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
            Aucune facture disponible sur le plan gratuit
          </p>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Accédez au portail Stripe pour consulter vos factures et modifier votre mode de paiement.
          </p>
        )}
      </div>
    </div>
  );
}
