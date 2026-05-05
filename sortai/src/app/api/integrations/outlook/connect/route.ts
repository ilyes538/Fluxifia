export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireSession, encodeState, getAppUrl } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const clientId = process.env.AZURE_AD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Microsoft OAuth non configuré" }, { status: 501 });
  }

  const orgId = session.user.orgId ?? "";
  const tenantId = process.env.AZURE_AD_TENANT_ID ?? "common";
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/integrations/outlook/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "Mail.ReadWrite Mail.Send Calendars.ReadWrite offline_access",
    state: encodeState(orgId),
    response_mode: "query",
  });

  return NextResponse.redirect(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params}`
  );
}
