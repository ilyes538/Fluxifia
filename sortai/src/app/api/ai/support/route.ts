export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["analyze_ticket", "suggest_solution", "escalate"]),
  ticketId: z.string().optional(),
  subject: z.string().optional(),
  description: z.string().min(1).max(10000),
  customerName: z.string().optional(),
  customerHistory: z.string().optional(),
  category: z.string().optional(),
});

const prompts: Record<string, string> = {
  analyze_ticket: `Analyse cette demande de support. Retourne un JSON avec : category (bug|feature_request|billing|account|other), severity (critical|high|medium|low), summary (string), estimatedResolutionTime (string), requiresHuman (boolean), reason (string).`,
  suggest_solution: `Propose une solution claire et étape par étape pour résoudre ce problème de support. Sois précis, empathique et professionnel. Inclus des alternatives si la solution principale ne fonctionne pas.`,
  escalate: `Prépare un résumé d'escalade pour l'équipe technique. Retourne un JSON avec : priority (critical|high|medium), summary (string), impactAssessment (string), recommendedTeam (string), context (string), suggestedNextSteps (array of strings).`,
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

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "support", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Support non activé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { action, ticketId, subject, description, customerName, customerHistory, category } = parsed.data;

  const input = [
    ticketId ? `Ticket ID : ${ticketId}` : null,
    customerName ? `Client : ${customerName}` : null,
    subject ? `Sujet : ${subject}` : null,
    category ? `Catégorie : ${category}` : null,
    customerHistory ? `Historique client :\n${customerHistory}` : null,
    `Description :\n${description}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await runAgent({
    type: "support",
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
