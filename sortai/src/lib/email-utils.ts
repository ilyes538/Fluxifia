export interface EmailPreview {
  gmailId: string;
  from: string;
  subject: string;
  date: string;
}

export interface FetchedMessage {
  gmailId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  bodyHtml: string;
}

export interface AnalyzedEmail {
  id: string;
  gmailId: string;
  type: string;
  from: string;
  subject: string;
  summary: string;
  receivedAt: string;
  draftAnswer: string | null;
}

export interface ReportDocument {
  period: string;
  totalEmails: number;
  stats: {
    prospectClient: number;
    interne: number;
    newsletterPromotion: number;
    information: number;
    needsReply: number;
  };
  summary: string;
  emails: AnalyzedEmail[];
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  period: string;
  totalEmails: number;
  summary: string;
  tokenCost: number;
  stats: string;
  gmailEmail: string | null;
}

export interface MonthlyStats {
  reportsCount: number;
  totalEmails: number;
  typeBreakdown: {
    prospectClient: number;
    interne: number;
    newsletterPromotion: number;
    information: number;
    needsReply: number;
  };
}

export interface SyncResponse {
  count: number;
  preview: EmailPreview[];
  messages: FetchedMessage[];
}

export function parseSender(from: string) {
  const m = from.match(/(.*)<(.*)>/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: from.trim(), email: from.trim() };
}

export function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export function openInGmail(gmailId: string) {
  window.open(`https://mail.google.com/mail/u/0/#all/${gmailId}`, "_blank", "noopener,noreferrer");
}

export const TYPE_COLORS: Record<string, { bg: string; text: string; chart: string }> = {
  "Prospect/Client": { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", chart: "#3b82f6" },
  "Interne": { bg: "rgba(16,185,129,0.15)", text: "#34d399", chart: "#10b981" },
  "Newsletter/Promotion": { bg: "rgba(139,92,246,0.15)", text: "#a78bfa", chart: "#8b5cf6" },
  "Information": { bg: "rgba(107,114,128,0.15)", text: "#9ca3af", chart: "#6b7280" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #7c3aed, #6366f1)",
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #ec4899, #f43f5e)",
  "linear-gradient(135deg, #10b981, #34d399)",
  "linear-gradient(135deg, #f59e0b, #fbbf24)",
  "linear-gradient(135deg, #8b5cf6, #a78bfa)",
];

export function avatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}
