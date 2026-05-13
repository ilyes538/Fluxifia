export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  orgName: z.string().min(2).max(150).optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { name, orgName, industry, size } = parsed.data;

  await Promise.all([
    name
      ? prisma.user.update({ where: { id: session.user.id }, data: { name } })
      : Promise.resolve(),
    session.user.orgId && (orgName || industry || size)
      ? prisma.organization.update({
          where: { id: session.user.orgId },
          data: {
            ...(orgName && { name: orgName }),
            ...(industry !== undefined && { industry }),
            ...(size !== undefined && { size }),
          },
        })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ success: true });
}
