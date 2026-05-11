"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { PlanKey } from "@/lib/utils";

interface Props {
  plan: PlanKey;
  targetPlan?: PlanKey;
  hasStripe: boolean;
  orgId: string;
  userEmail: string;
  orgName: string;
  compact?: boolean;
}

export function BillingActions({ plan, targetPlan, hasStripe, orgId, userEmail, orgName, compact }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, userEmail, orgName, targetPlan: targetPlan ?? (plan === "free" ? "starter" : plan) }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  async function handlePortal() {
    setLoading(true);
    const res = await fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setLoading(false);
  }

  if (targetPlan) {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={compact ? "btn-primary text-xs w-full flex items-center justify-center gap-1" : "btn-primary text-sm flex items-center gap-2 mt-4"}
      >
        {loading && <Loader2 size={12} className="animate-spin" />}
        Passer à ce plan
      </button>
    );
  }

  if (plan === "free") {
    return (
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn-primary text-sm flex items-center gap-2 mt-4"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Passer au plan Starter
      </button>
    );
  }

  if (hasStripe) {
    return (
      <button
        onClick={handlePortal}
        disabled={loading}
        className="btn-secondary text-sm flex items-center gap-2 mt-4"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Gérer l&apos;abonnement
      </button>
    );
  }

  return null;
}
