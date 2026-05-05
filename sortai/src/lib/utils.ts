import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

export const PLANS = {
  free: {
    name: "Gratuit",
    price: 0,
    agents: 1,
    emails: 100,
    integrations: 1,
    features: ["1 agent IA", "100 emails/mois", "1 intégration", "Support communauté"],
  },
  starter: {
    name: "Starter",
    price: 4900,
    agents: 3,
    emails: 1000,
    integrations: 3,
    features: ["3 agents IA", "1 000 emails/mois", "3 intégrations", "Gmail & Outlook", "Support email"],
  },
  pro: {
    name: "Pro",
    price: 9900,
    agents: 10,
    emails: 10000,
    integrations: 10,
    features: ["10 agents IA", "10 000 emails/mois", "Toutes les intégrations", "Slack & Notion", "Tableau de bord avancé", "Support prioritaire"],
  },
  enterprise: {
    name: "Enterprise",
    price: 29900,
    agents: -1, // unlimited
    emails: -1,
    integrations: -1,
    features: ["Agents illimités", "Emails illimités", "SSO / SAML", "Audit logs", "API dédiée", "Account manager dédié", "SLA 99.9%"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
