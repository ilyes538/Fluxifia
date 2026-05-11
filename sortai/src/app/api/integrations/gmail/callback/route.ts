export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decodeState, validateOrgAccess, getAppUrl } from "@/lib/oauth";
import { encrypt } from "@/lib/encryption";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const rawState = req.nextUrl.searchParams.get("state");
  const appUrl = getAppUrl();

  if (!code || !rawState) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=gmail`);
  }

  const orgId = decodeState(rawState);
  if (!orgId) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=gmail_csrf`);
  }

  const authorized = await validateOrgAccess(orgId);
  if (!authorized) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=gmail_unauthorized`);
  }

  const redirectUri = `${appUrl}/api/integrations/gmail/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=gmail_token`);
  }

  const tokens = await tokenRes.json();

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userRes.json();

  await prisma.integration.upsert({
    where: { orgId_type: { orgId, type: "gmail" } },
    create: {
      orgId, type: "gmail", name: "Gmail",
      connected: true,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      scopes: tokens.scope,
      gmailEmail: userInfo.email,
      metadata: JSON.stringify({ email: userInfo.email }),
    },
    update: {
      connected: true,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
      gmailEmail: userInfo.email,
      metadata: JSON.stringify({ email: userInfo.email }),
    },
  });

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=gmail`);
}
