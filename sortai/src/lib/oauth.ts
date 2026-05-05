import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

// ── Session & CSRF ──────────────────────────────────────────────

export async function requireSession() {
  return getServerSession(authOptions);
}

export function encodeState(orgId: string): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  const hmac = crypto.createHmac("sha256", secret).update(orgId).digest("hex").slice(0, 16);
  return `${orgId}.${hmac}`;
}

export function decodeState(state: string): string | null {
  const dotIndex = state.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const orgId = state.slice(0, dotIndex);
  return state === encodeState(orgId) ? orgId : null;
}

export async function validateOrgAccess(orgId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return session?.user?.orgId === orgId;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function unauthorizedRedirect(provider: string): NextResponse {
  return NextResponse.redirect(
    `${getAppUrl()}/dashboard/integrations?error=${provider}_unauthorized`
  );
}

// ── Token refresh ────────────────────────────────────────────────

interface TokenRefreshResult {
  accessToken: string;
  expiresAt: Date;
}

async function refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResult> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Échec du refresh token Google");
  const data = await res.json();
  return { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

async function refreshMicrosoftToken(refreshToken: string): Promise<TokenRefreshResult> {
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID ?? "",
      client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Échec du refresh token Microsoft");
  const data = await res.json();
  return { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) };
}

export async function getValidAccessToken(integrationId: string): Promise<string> {
  const integration = await prisma.integration.findUnique({ where: { id: integrationId } });
  if (!integration?.accessToken) throw new Error("Intégration non connectée");

  if (integration.expiresAt && integration.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return integration.accessToken;
  }

  if (!integration.refreshToken) throw new Error("Refresh token manquant — reconnectez l'intégration");

  const refreshed = integration.type === "gmail"
    ? await refreshGoogleToken(integration.refreshToken)
    : integration.type === "outlook"
    ? await refreshMicrosoftToken(integration.refreshToken)
    : (() => { throw new Error(`Refresh non supporté pour ${integration.type}`); })();

  await prisma.integration.update({
    where: { id: integrationId },
    data: { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt },
  });

  return refreshed.accessToken;
}
