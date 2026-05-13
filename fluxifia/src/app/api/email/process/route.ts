export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  emailIds: z.array(z.string()).min(1).max(5),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const orgId = session.user.orgId;
    if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

    const { allowed, used, limit } = await checkTokenLimit(orgId);
    if (!allowed) {
      return NextResponse.json({ error: `Limite mensuelle atteinte (${used}/${limit} tokens).` }, { status: 429 });
    }

    const agent = await prisma.agent.findFirst({ where: { orgId, type: "email", enabled: true } });
    if (!agent) return NextResponse.json({ error: "Agent Email non activé" }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Données invalides (max 5 emails)" }, { status: 400 });

    const { emailIds } = parsed.data;
    const results = [];
    let totalTokens = 0;

    for (const id of emailIds) {
      const email = await prisma.emailLog.findFirst({ where: { id, orgId } });
      if (!email) continue;
      if (email.summary) continue;

      const result = await runAgent({
        type: "email",
        systemPrompt: agent.systemPrompt ?? undefined,
        input: `Sujet : ${email.subject ?? "Sans sujet"}\nDe : ${email.from ?? "Inconnu"}\n\n${email.body ?? ""}`,
        context: {
          task: `Analyse cet email et retourne UNIQUEMENT un JSON valide avec ces champs :
{
  "category": "support|commercial|urgent|newsletter|internal|other",
  "priority": "high|medium|low",
  "summary": "résumé en 1-2 phrases",
  "suggestedReply": "réponse professionnelle complète en français"
}`,
        },
      });

      let category = "other";
      let priority = "medium";
      let summary = "";
      let aiReply = "";

      try {
        const json = JSON.parse(result.output.replace(/```json|```/g, "").trim());
        category = json.category ?? "other";
        priority = json.priority ?? "medium";
        summary = json.summary ?? "";
        aiReply = json.suggestedReply ?? "";
      } catch {
        summary = result.output.slice(0, 200);
      }

      await prisma.emailLog.update({
        where: { id },
        data: {
          category,
          priority,
          summary,
          aiReply,
          aiResponse: result.output.slice(0, 1000),
          action: "categorized",
        },
      });

      await prisma.agentRun.create({
        data: {
          agentId: agent.id,
          status: "success",
          input: (email.body ?? "").slice(0, 500),
          output: result.output.slice(0, 1000),
          tokensUsed: result.tokensUsed,
          durationMs: result.durationMs,
        },
      });

      totalTokens += result.tokensUsed;
      results.push({ id, summary, category, priority });
    }

    return NextResponse.json({ processed: results.length, results, totalTokens });
  } catch (err) {
    console.error("Process error:", err);
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
