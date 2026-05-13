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
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=slack`);
  }

  const orgId = decodeState(rawState);
  if (!orgId) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=slack_csrf`);
  }

  const authorized = await validateOrgAccess(orgId);
  if (!authorized) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=slack_unauthorized`);
  }

  const tokenRes = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID ?? "",
      client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
    }),
  });

  const data = await tokenRes.json();
  if (!data.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=slack_token`);
  }

  await prisma.integration.upsert({
    where: { orgId_type: { orgId, type: "slack" } },
    create: {
      orgId, type: "slack", name: "Slack",
      connected: true,
      accessToken: encrypt(data.access_token),
      metadata: JSON.stringify({ workspace: data.team?.name }),
    },
    update: {
      connected: true,
      accessToken: encrypt(data.access_token),
      metadata: JSON.stringify({ workspace: data.team?.name }),
    },
  });

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=slack`);
}
