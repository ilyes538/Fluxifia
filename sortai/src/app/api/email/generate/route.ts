export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth";
import { checkActionCredits, AGENT_CREDIT_COSTS, isUnlimited } from "@/lib/limits";
import OpenAI from "openai";

interface MessageInput {
  gmailId: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  bodyHtml: string;
}

interface AnalyzedEmail {
  id: string;
  type: string;
  from: string;
  subject: string;
  summary: string;
  receivedAt: string;
  draftAnswer: string | null;
}

const SYSTEM_PROMPT = `Tu es un assistant email professionnel. Tu analyses UN email et tu réponds STRICTEMENT en JSON.

Règles:
- type: choisis UNIQUEMENT parmi "Prospect/Client", "Interne", "Newsletter/Promotion", "Information"
- summary: 1-2 phrases maximum en français
- draftAnswer: réponse professionnelle suggérée en français, ou null si aucune réponse n'est nécessaire (newsletter, promotion, notification automatique)
- Ne réponds QUE le JSON. Pas de markdown \`\`\`json, pas d'explication.

Format attendu:
{"type":"...","summary":"...","draftAnswer":"..."}`;

function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

async function analyzeEmail(message: MessageInput, apiKey: string): Promise<{ type: string; summary: string; draftAnswer: string | null; tokensUsed: number }> {
  const openai = new OpenAI({ apiKey });
  const userPrompt = `De: ${message.from}\nSujet: ${message.subject}\nDate: ${message.date}\n\nContenu:\n${message.body.slice(0, 4000)}`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 512,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = res.choices[0]?.message?.content ?? "";
  const tokensUsed = (res.usage?.prompt_tokens ?? 0) + (res.usage?.completion_tokens ?? 0);

  try {
    const cleaned = cleanJsonOutput(raw);
    const parsed = JSON.parse(cleaned) as { type?: string; summary?: string; draftAnswer?: string | null };
    return {
      type: parsed.type ?? "Information",
      summary: parsed.summary ?? "Non analysé",
      draftAnswer: parsed.draftAnswer ?? null,
      tokensUsed,
    };
  } catch {
    return {
      type: "Information",
      summary: "Non analysé (erreur parsing)",
      draftAnswer: null,
      tokensUsed,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const orgId = session.user.orgId;
    if (!orgId) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 400 });

    const integration = await prisma.integration.findUnique({
      where: { orgId_type: { orgId, type: "gmail" } },
    });
    if (!integration?.connected || !integration.accessToken) {
      return NextResponse.json({ error: "Gmail non connecté" }, { status: 400 });
    }

    // Ensure token is valid (refresh if needed)
    await getValidAccessToken(integration.id);

    const body = (await req.json()) as { messages?: MessageInput[]; selectedIds?: string[] };
    let messages = body.messages ?? [];
    if (body.selectedIds && body.selectedIds.length > 0) {
      messages = messages.filter((m) => body.selectedIds?.includes(m.gmailId));
    }
    if (messages.length === 0) {
      return NextResponse.json({ error: "Aucun email à analyser" }, { status: 400 });
    }

    // STRICT credit check (only superusers bypass)
    // Agent email = 1 crédit par email traité
    if (!isUnlimited(session.user.email, session.user.role)) {
      const creditCheck = await checkActionCredits(orgId, "email", messages.length);
      if (!creditCheck.allowed) {
        return NextResponse.json(
          { error: `Vous avez ${creditCheck.remaining} crédit${creditCheck.remaining > 1 ? "s" : ""} restant${creditCheck.remaining > 1 ? "s" : ""}. Cette action en coûte ${creditCheck.cost}. Sélectionnez au maximum ${Math.floor(creditCheck.remaining / (AGENT_CREDIT_COSTS["email"] ?? 1))} email${Math.floor(creditCheck.remaining / (AGENT_CREDIT_COSTS["email"] ?? 1)) > 1 ? "s" : ""}.` },
          { status: 403 }
        );
      }
    }

    const apiKey = process.env.OPENAI_API_KEY ?? "";
    const isMock = !apiKey || apiKey.includes("fakekey") || apiKey.includes("localdev") || apiKey.startsWith("sk-test");

    const analyzedEmails: AnalyzedEmail[] = [];
    let totalTokens = 0;

    if (isMock) {
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        analyzedEmails.push({
          id: `email_${String(i + 1).padStart(3, "0")}`,
          type: i % 3 === 0 ? "Prospect/Client" : i % 3 === 1 ? "Newsletter/Promotion" : "Information",
          from: msg.from,
          subject: msg.subject,
          summary: "Résumé mock (mode développement sans clé API valide).",
          receivedAt: msg.date,
          draftAnswer: i % 3 === 0 ? "Bonjour, merci pour votre message. Nous vous recontacterons rapidement. Cordialement," : null,
        });
      }
    } else {
      for (let i = 0; i < messages.length; i += 3) {
        const batch = messages.slice(i, i + 3);
        const batchResults = await Promise.all(
          batch.map(async (msg, idx) => {
            const result = await analyzeEmail(msg, apiKey);
            return {
              id: `email_${String(i + idx + 1).padStart(3, "0")}`,
              type: result.type,
              from: msg.from,
              subject: msg.subject,
              summary: result.summary,
              receivedAt: msg.date,
              draftAnswer: result.draftAnswer,
              tokensUsed: result.tokensUsed,
            };
          })
        );
        analyzedEmails.push(...batchResults.map(({ tokensUsed, ...rest }) => rest));
        totalTokens += batchResults.reduce((sum, r) => sum + r.tokensUsed, 0);
      }
    }

    const stats = {
      prospectClient: analyzedEmails.filter((e) => e.type === "Prospect/Client").length,
      interne: analyzedEmails.filter((e) => e.type === "Interne").length,
      newsletterPromotion: analyzedEmails.filter((e) => e.type === "Newsletter/Promotion").length,
      information: analyzedEmails.filter((e) => e.type === "Information").length,
      needsReply: analyzedEmails.filter((e) => e.draftAnswer !== null).length,
    };

    const summary = `${analyzedEmails.length} email${analyzedEmails.length > 1 ? "s" : ""} analysé${analyzedEmails.length > 1 ? "s" : ""} : ${stats.prospectClient} Prospect/Client, ${stats.interne} Interne, ${stats.newsletterPromotion} Newsletter/Promotion, ${stats.information} Information. ${stats.needsReply} réponse${stats.needsReply > 1 ? "s" : ""} suggérée${stats.needsReply > 1 ? "s" : ""}.`;

    const document = {
      period: "24h",
      totalEmails: analyzedEmails.length,
      stats,
      summary,
      emails: analyzedEmails,
    };

    const report = await prisma.report.create({
      data: {
        orgId,
        period: "24h",
        totalEmails: analyzedEmails.length,
        stats: JSON.stringify(stats),
        summary,
        content: JSON.stringify(analyzedEmails),
        tokenCost: totalTokens,
      },
    });

    const agent = await prisma.agent.findFirst({ where: { orgId, type: "email" } });
    if (agent) {
      await prisma.agentRun.create({
        data: {
          agentId: agent.id,
          status: "success",
          input: `Génération compte rendu — ${analyzedEmails.length} emails`,
          output: summary,
          tokensUsed: totalTokens,
          creditsUsed: messages.length * (AGENT_CREDIT_COSTS["email"] ?? 1),
          durationMs: 0,
        },
      });
    }

    return NextResponse.json({ document, reportId: report.id });
  } catch (err) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
