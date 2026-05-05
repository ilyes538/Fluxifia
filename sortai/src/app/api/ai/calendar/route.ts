export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/anthropic";
import { checkTokenLimit } from "@/lib/limits";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["analyze_request", "suggest_slots", "create_event"]),
  request: z.string().optional(),
  availability: z.string().optional(),
  participants: z.string().optional(),
  duration: z.string().optional(),
  eventTitle: z.string().optional(),
  eventDate: z.string().optional(),
  eventContext: z.string().optional(),
});

const prompts: Record<string, string> = {
  analyze_request: `Analyse cette demande de réunion. Identifie l'objectif, les participants requis, la durée estimée et l'urgence. Retourne un JSON avec : objective, participants, estimatedDuration, urgency (high|medium|low), suggestedFormat (visio|présentiel|téléphone).`,
  suggest_slots: `Basé sur les disponibilités et contraintes fournies, suggère 3 créneaux optimaux pour cette réunion. Pour chaque créneau, explique pourquoi il est adapté. Retourne un JSON avec un tableau slots contenant : date, time, duration, reason.`,
  create_event: `Rédige une invitation de réunion professionnelle complète avec : titre, date/heure, lieu/lien, ordre du jour structuré, et les informations pratiques nécessaires.`,
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

  const agent = await prisma.agent.findFirst({ where: { orgId, type: "calendar", enabled: true } });
  if (!agent) return NextResponse.json({ error: "Agent Agenda non activé" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { action, request, availability, participants, duration, eventTitle, eventDate, eventContext } = parsed.data;

  const input = [
    request ? `Demande : ${request}` : null,
    participants ? `Participants : ${participants}` : null,
    duration ? `Durée souhaitée : ${duration}` : null,
    availability ? `Disponibilités :\n${availability}` : null,
    eventTitle ? `Titre de l'événement : ${eventTitle}` : null,
    eventDate ? `Date/heure : ${eventDate}` : null,
    eventContext ? `Contexte : ${eventContext}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const result = await runAgent({
    type: "calendar",
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
