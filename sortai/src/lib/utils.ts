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
    name: "Aucun plan",
    price: 0,
    annualPrice: 0,
    agents: 1,
    emails: 0,
    integrations: 1,
    features: ["Souscription requise", "Aucun crédit inclus"],
  },
  starter: {
    name: "Essentiel",
    price: 4999,
    annualPrice: 49900,
    agents: 3,
    emails: 3000,
    integrations: 3,
    features: ["3 000 crédits/mois", "Agent Email", "Agent Agenda", "3 intégrations", "Support email"],
  },
  pro: {
    name: "Croissance",
    price: 8999,
    annualPrice: 89990,
    agents: 6,
    emails: 7000,
    integrations: 6,
    features: ["7 000 crédits/mois", "Agents Email, Agenda et Lead", "6 intégrations", "Tableau de bord avancé", "Support prioritaire"],
  },
  enterprise: {
    name: "Scale",
    price: 11249,
    annualPrice: 112490,
    agents: 12,
    emails: 15000,
    integrations: 12,
    features: ["15 000 crédits/mois", "5x plus de crédits que l'Essentiel", "Tous les agents disponibles", "12 intégrations", "Support prioritaire", "Meilleur coût par crédit"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;
