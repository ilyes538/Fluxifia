export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["create_page", "summarize_page", "generate_report"]),
  title: z.string().optional(),
  content: z.string().optional(),
  data: z.string().optional(),
  reportType: z.string().optional(),
});

const prompts: Record<string, string> = {
  create_page: `Génère le contenu structuré d'une page Notion en Markdown basé sur le titre et le contexte fournis. Inclus des sections claires, des listes et des tableaux si pertinents.`,
  summarize_page: `Résume le contenu de cette page Notion en points clés. Identifie les informations importantes, les dates clés et les actions à faire.`,
  generate_report: `Génère un rapport professionnel structuré en Markdown basé sur les données fournies. Inclus une introduction, des sections thématiques et une conclusion avec recommandations.`,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orgId = session.user.orgId;
  if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

  const { allowed, used, limit } = await checkTokenLimit(orgId);
  if (!allowed) {
    return NextResponse.json({ error: `Limite mensuelle atteinte (${used}/${limit} tokens). Passez à un plan supérieur.` }, { status: 429 });
  }

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "notion", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Notion non activé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { action, title, content, data, reportType } = parsed.data;

  const input = [
    title ? `Titre : ${title}` : null,
    reportType ? `Type de rapport : ${reportType}` : null,
    content ? `Contenu actuel :\n${content}` : null,
    data ? `Données :\n${data}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await runAgent({
    type: "notion",
    systemPrompt: agent.systemPrompt ?? undefined,
    input,
    context: { task: prompts[action] },
  });

  await prisma.agentRun.create({
    data: {
      agentId: agent.id,
      status: "success",
      input: input.slice(0, 500),
      output: result.output.slice(0, 1000),
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    },
  });

  return NextResponse.json({ output: result.output, tokensUsed: result.tokensUsed });
}
