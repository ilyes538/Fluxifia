export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/email/:path*",
    "/api/reports/:path*",
    "/api/usage/:path*",
    "/api/integrations/:path*",
    "/api/settings/:path*",
    "/api/admin/:path*",
    "/api/billing/portal/:path*",
    "/api/billing/checkout/:path*",
    "/api/agents/:path*",
    "/api/invitations/:path*",
  ],
};
