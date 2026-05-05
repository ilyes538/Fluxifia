export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireSession, encodeState, getAppUrl } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Notion OAuth non configuré" }, { status: 501 });
  }

  const orgId = session.user.orgId ?? "";
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/integrations/notion/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    owner: "user",
    redirect_uri: redirectUri,
    state: encodeState(orgId),
  });

  return NextResponse.redirect(`https://api.notion.com/v1/oauth/authorize?${params}`);
}
