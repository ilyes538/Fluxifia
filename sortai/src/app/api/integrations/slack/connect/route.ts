export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireSession, encodeState, getAppUrl } from "@/lib/oauth";

export async function GET(_req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Slack OAuth non configuré" }, { status: 501 });
  }

  const orgId = session.user.orgId ?? "";
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/integrations/slack/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "channels:read,chat:write,users:read,channels:history",
    redirect_uri: redirectUri,
    state: encodeState(orgId),
  });

  return NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params}`);
}
