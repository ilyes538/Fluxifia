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
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=notion`);
  }

  const orgId = decodeState(rawState);
  if (!orgId) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=notion_csrf`);
  }

  const authorized = await validateOrgAccess(orgId);
  if (!authorized) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=notion_unauthorized`);
  }

  const credentials = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`
  ).toString("base64");

  const redirectUri = `${appUrl}/api/integrations/notion/callback`;

  const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/integrations?error=notion_token`);
  }

  const data = await tokenRes.json();

  await prisma.integration.upsert({
    where: { orgId_type: { orgId, type: "notion" } },
    create: {
      orgId, type: "notion", name: "Notion",
      connected: true,
      accessToken: encrypt(data.access_token),
      metadata: JSON.stringify({ workspace: data.workspace_name, name: data.owner?.user?.name }),
    },
    update: {
      connected: true,
      accessToken: encrypt(data.access_token),
      metadata: JSON.stringify({ workspace: data.workspace_name }),
    },
  });

  return NextResponse.redirect(`${appUrl}/dashboard/integrations?success=notion`);
}
