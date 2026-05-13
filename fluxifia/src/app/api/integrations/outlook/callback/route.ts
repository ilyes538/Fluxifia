export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodeState, validateOrgAccess, getAppUrl } from "@/lib/oauth";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const rawState = req.nextUrl.searchParams.get("state");
  const appUrl = getAppUrl();
  const tenantId = process.env.AZURE_AD_TENANT_ID ?? "common";

  if (!code || !rawState) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=outlook`);
  }

  const orgId = decodeState(rawState);
  if (!orgId) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=outlook_csrf`);
  }

  const authorized = await validateOrgAccess(orgId);
  if (!authorized) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=outlook_unauthorized`);
  }

  const redirectUri = `${appUrl}/api/integrations/outlook/callback`;

  const tokenRes = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.AZURE_AD_CLIENT_ID ?? "",
        client_secret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    }
  );

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=outlook_token`);
  }

  const tokens = await tokenRes.json();

  const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userRes.json();

  await prisma.integration.upsert({
    where: { orgId_type: { orgId, type: "outlook" } },
    create: {
      orgId, type: "outlook", name: "Outlook",
      connected: true,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      scopes: tokens.scope,
      gmailEmail: userInfo.mail ?? userInfo.userPrincipalName,
      metadata: JSON.stringify({ email: userInfo.mail ?? userInfo.userPrincipalName }),
    },
    update: {
      connected: true,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
      gmailEmail: userInfo.mail ?? userInfo.userPrincipalName,
      metadata: JSON.stringify({ email: userInfo.mail ?? userInfo.userPrincipalName }),
    },
  });

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=outlook`);
}
