import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export type Role = "owner" | "admin" | "member";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function hasPermission(userRole: string, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userLevel >= requiredLevel;
}

export async function requireRole(requiredRole: Role) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null };
  }
  if (!hasPermission(session.user.role ?? "member", requiredRole)) {
    return { error: NextResponse.json({ error: "Droits insuffisants" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
