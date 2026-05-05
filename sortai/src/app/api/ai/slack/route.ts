export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["summarize_thread", "answer_question", "draft_message"]),
  channel: z.string().optional(),
  thread: z.string().optional(),
  question: z.string().optional(),
  context: z.string().optional(),
});

const prompts: Record<string, string> = {
  summarize_thread: `Résume ce fil de discussion Slack en points clés. Identifie les décisions prises, les actions à faire et les points importants. Sois concis.`,
  answer_question: `Réponds à cette question posée dans Slack de manière claire et utile. Si tu n'as pas assez de contexte, demande des précisions.`,
  draft_message: `Rédige un message Slack professionnel et clair basé sur le contexte fourni. Adapte le ton au canal (formel ou informel).`,
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

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "slack", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Slack non activé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { action, channel, thread, question, context } = parsed.data;

  const input = [
    channel ? `Canal : ${channel}` : null,
    thread ? `Fil de discussion :\n${thread}` : null,
    question ? `Question : ${question}` : null,
    context ? `Contexte : ${context}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await runAgent({
    type: "slack",
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
