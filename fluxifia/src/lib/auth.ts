import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { slugify } from "./utils";

const azureClientId = process.env.AZURE_AD_CLIENT_ID;
const azureClientSecret = process.env.AZURE_AD_CLIENT_SECRET;
const azureTenantId = process.env.AZURE_AD_TENANT_ID || "common";

type AuthUser = import("next-auth").User | import("next-auth/adapters").AdapterUser;

async function createAzureUser(user: AuthUser, profile?: unknown) {
  const azureProfile = profile as { email?: string; preferred_username?: string; name?: string } | undefined;
  const email = (user.email || azureProfile?.email || azureProfile?.preferred_username)?.toLowerCase();
  if (!email) return false;

  const existing = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (existing) {
    user.id = existing.id;
    user.email = existing.email;
    user.name = existing.name;
    user.role = existing.role;
    user.orgId = existing.orgId;
    user.orgName = existing.organization?.name ?? null;
    user.emailVerified = existing.emailVerified;
    return true;
  }

  const displayName = user.name || azureProfile?.name || email.split("@")[0];
  const domain = email.split("@")[1] || "fluxifia";
  const orgName = domain.split(".")[0] || "Fluxifia";
  const baseSlug = slugify(orgName) || "fluxifia";
  const count = await prisma.organization.count({ where: { slug: { startsWith: baseSlug } } });
  const slug = count > 0 ? `${baseSlug}-${count}` : baseSlug;
  const password = await bcrypt.hash(crypto.randomUUID(), 12);

  const created = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: orgName, slug },
    });

    const newUser = await tx.user.create({
      data: {
        email,
        name: displayName,
        password,
        role: "member",
        emailVerified: true,
        orgId: organization.id,
      },
    });

    await tx.subscription.create({
      data: { orgId: organization.id, plan: "free" },
    });

    return { user: newUser, organization };
  });

  user.id = created.user.id;
  user.email = created.user.email;
  user.name = created.user.name;
  user.role = created.user.role;
  user.orgId = created.user.orgId;
  user.orgName = created.organization.name;
  user.emailVerified = created.user.emailVerified;

  return true;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organization: true },
        });

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          orgId: user.orgId,
          orgName: user.organization?.name ?? null,
          emailVerified: user.emailVerified,
        };
      },
    }),
    ...(azureClientId && azureClientSecret
      ? [
          AzureADProvider({
            clientId: azureClientId,
            clientSecret: azureClientSecret,
            tenantId: azureTenantId,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "azure-ad") {
        return createAzureUser(user, profile);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as import("next-auth").User;
        token.id = u.id as string;
        token.role = u.role ?? "";
        token.orgId = u.orgId ?? null;
        token.orgName = u.orgName ?? null;
        token.emailVerified = u.emailVerified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.orgId = token.orgId as string | null;
        session.user.orgName = token.orgName as string | null;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
};

declare module "next-auth" {
  interface User {
    role?: string;
    orgId?: string | null;
    orgName?: string | null;
    emailVerified?: boolean;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      orgId: string | null;
      orgName: string | null;
      emailVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    orgId: string | null;
    orgName: string | null;
    emailVerified: boolean;
  }
}
