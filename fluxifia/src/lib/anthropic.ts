import OpenAI from "openai";

export type AgentType = "email" | "slack" | "notion" | "calendar" | "lead" | "support";

export interface AgentRunInput {
  type: AgentType;
  systemPrompt?: string;
  model?: string;
  input: string;
  context?: Record<string, string>;
}

export interface AgentRunResult {
  output: string;
  tokensUsed: number;
  durationMs: number;
}

export async function runAgent(params: AgentRunInput): Promise<AgentRunResult> {
  const start = Date.now();

  // Mode dev mock : pas de clé API = réponse fake gratuite
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const isMock = !apiKey || apiKey.includes("fakekey") || apiKey.includes("localdev") || apiKey.startsWith("sk-test");
  if (isMock) {
    const mockReplies: Record<AgentType, string> = {
      email: JSON.stringify({
        category: "commercial",
        priority: "medium",
        summary: "Email de test traité en mode développement (aucune clé API configurée).",
        suggestedReply: "Bonjour,\n\nMerci pour votre message. Nous vous recontacterons dans les plus brefs délais.\n\nCordialement,\nL'équipe"
      }),
      slack: "Réponse Slack mock (mode dev)",
      notion: "Résumé Notion mock (mode dev)",
      calendar: "Proposition de créneau mock (mode dev)",
      lead: "Lead qualifié : score 7/10 (mode dev)",
      support: "Solution suggérée : redémarrer l'application (mode dev)",
    };
    return {
      output: mockReplies[params.type] ?? mockReplies.email,
      tokensUsed: 0,
      durationMs: Date.now() - start,
    };
  }

  const openai = new OpenAI({ apiKey });

  const defaultPrompts: Record<AgentType, string> = {
    email: `Tu es un assistant IA spécialisé dans le traitement des emails professionnels pour une PME.
Tu dois : analyser les emails entrants, les catégoriser (support, commercial, urgent, newsletter, autre),
suggérer ou rédiger une réponse appropriée, et identifier les actions prioritaires.
Réponds toujours en français de manière professionnelle et concise.`,

    slack: `Tu es un assistant IA intégré à Slack pour une PME.
Tu réponds aux questions des employés, facilites la coordination d'équipe,
résumes les discussions longues, et aides à la gestion des tâches.
Sois concis, utile et professionnel.`,

    notion: `Tu es un assistant IA pour Notion d'une PME.
Tu aides à créer, mettre à jour et organiser les pages et bases de données.
Tu peux générer des résumés, des rapports et structurer l'information.`,

    calendar: `Tu es un assistant IA de gestion d'agenda pour une PME.
Tu analyses les demandes de réunion, suggères des créneaux optimaux,
et aides à la planification des événements professionnels.`,

    lead: `Tu es un assistant IA de qualification de leads pour une PME.
Tu analyses les informations sur les prospects entrants, les scores selon leur potentiel,
et suggères les prochaines actions commerciales appropriées.`,

    support: `Tu es un assistant IA de support client pour une PME.
Tu analyses les demandes de support, proposes des solutions,
escalades les cas complexes et maintiens un ton professionnel et empathique.`,
  };

  const systemPrompt = params.systemPrompt || defaultPrompts[params.type];
  const model = params.model?.startsWith("claude") ? "gpt-4o" : (params.model || "gpt-4o");

  const contextStr = params.context
    ? Object.entries(params.context)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";

  const userMessage = contextStr
    ? `Contexte:\n${contextStr}\n\n---\n\n${params.input}`
    : params.input;

  const response = await openai.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  const output = response.choices[0]?.message?.content ?? "";
  const tokensUsed = (response.usage?.prompt_tokens ?? 0) + (response.usage?.completion_tokens ?? 0);

  return {
    output,
    tokensUsed,
    durationMs: Date.now() - start,
  };
}
