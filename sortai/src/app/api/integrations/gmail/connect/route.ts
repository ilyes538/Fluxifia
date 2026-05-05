export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireSession, encodeState, getAppUrl } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth non configuré" }, { status: 501 });
  }

  const orgId = session.user.orgId ?? "";
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/integrations/gmail/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify",
    access_type: "offline",
    prompt: "consent",
    state: encodeState(orgId),
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
