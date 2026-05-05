export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["qualify", "score", "suggest_action"]),
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
  industry: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
});

const prompts: Record<string, string> = {
  qualify: `Qualifie ce lead selon les critères BANT (Budget, Authority, Need, Timeline). Retourne un JSON avec : qualified (true|false), budgetScore (0-10), authorityScore (0-10), needScore (0-10), timelineScore (0-10), summary (string), redFlags (array of strings).`,
  score: `Calcule un score de potentiel pour ce lead de 0 à 100. Retourne un JSON avec : score (number), tier (hot|warm|cold), reasoning (string), keyStrengths (array), keyWeaknesses (array).`,
  suggest_action: `Basé sur le profil de ce lead, suggère les prochaines actions commerciales concrètes. Retourne un JSON avec : nextAction (string), priority (high|medium|low), messageTemplate (string), followUpDate (string au format YYYY-MM-DD), channel (email|phone|linkedin).`,
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

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "lead", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Lead non activé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { action, name, company, email, message, source, industry, budget, timeline } = parsed.data;

  const input = [
    name ? `Nom : ${name}` : null,
    company ? `Entreprise : ${company}` : null,
    email ? `Email : ${email}` : null,
    industry ? `Secteur : ${industry}` : null,
    source ? `Source : ${source}` : null,
    budget ? `Budget : ${budget}` : null,
    timeline ? `Délai : ${timeline}` : null,
    message ? `Message :\n${message}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const result = await runAgent({
    type: "lead",
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
