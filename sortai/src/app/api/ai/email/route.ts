export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  subject: z.string().optional(),
  from: z.string().optional(),
  body: z.string().min(1).max(10000),
  action: z.enum(["categorize", "reply", "summarize"]).default("categorize"),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const orgId = session.user.orgId;
  if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

  const { allowed, used, limit } = await checkTokenLimit(orgId);
  if (!allowed) {
    return NextResponse.json({ error: `Limite mensuelle atteinte (${used}/${limit} tokens). Passez à un plan supérieur.` }, { status: 429 });
  }

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "email", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Email non activé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { subject, from, body: emailBody, action } = parsed.data;

  const prompts: Record<string, string> = {
    categorize: `Analyse cet email et retourne un JSON avec : category (support|commercial|urgent|newsletter|internal|other), priority (high|medium|low), summary (1 phrase), suggestedAction (string).`,
    reply: `Rédige une réponse professionnelle à cet email en français. Sois concis et utile.`,
    summarize: `Résume cet email en 2-3 phrases claires en français.`,
  };

  const result = await runAgent({
    type: "email",
    systemPrompt: agent.systemPrompt ?? undefined,
    input: `Sujet : ${subject ?? "Sans sujet"}\nDe : ${from ?? "Inconnu"}\n\n${emailBody}`,
    context: { task: prompts[action] },
  });

  let category = "other";
  if (action === "categorize") {
    try {
      const json = JSON.parse(result.output);
      category = json.category ?? "other";
    } catch { /* ignore */ }
  }

  await prisma.emailLog.create({
    data: { orgId, subject, from, action, category, aiResponse: result.output },
  });

  await prisma.agentRun.create({
    data: {
      agentId: agent.id,
      status: "success",
      input: emailBody.slice(0, 500),
      output: result.output.slice(0, 1000),
      tokensUsed: result.tokensUsed,
      durationMs: result.durationMs,
    },
  });

  return NextResponse.json({ output: result.output, tokensUsed: result.tokensUsed });
}
