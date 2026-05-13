export interface AgentUsage {
  type: string;
  name: string;
  creditsUsed: number;
  color: string;
}

export interface TimelinePoint {
  date: string;
  fullDate: string;
  [agentType: string]: string | number;
}

const AGENT_COLORS: Record<string, string> = {
  email: "#7c3aed",
  slack: "#4A154B",
  notion: "#ffffff",
  calendar: "#EA4335",
  lead: "#3b82f6",
  support: "#10b981",
};

const AGENT_NAMES: Record<string, string> = {
  email: "Email",
  slack: "Slack",
  notion: "Notion",
  calendar: "Agenda",
  lead: "Lead",
  support: "Support",
};

export function parseAgentUsages(runs: { agent: { type: string }; creditsUsed: number }[]): AgentUsage[] {
  const map = new Map<string, number>();
  for (const run of runs) {
    const type = run.agent.type;
    map.set(type, (map.get(type) ?? 0) + run.creditsUsed);
  }
  return Array.from(map.entries())
    .map(([type, creditsUsed]) => ({
      type,
      name: AGENT_NAMES[type] ?? type,
      creditsUsed,
      color: AGENT_COLORS[type] ?? "#6b7280",
    }))
    .sort((a, b) => b.creditsUsed - a.creditsUsed);
}

export function parseCreditTimeline(
  runs: { agent: { type: string }; creditsUsed: number; createdAt: Date }[],
  periodStart: Date
): { data: TimelinePoint[]; agentTypes: string[] } {
  if (runs.length === 0) {
    return { data: [], agentTypes: [] };
  }

  const agentTypes = Array.from(new Set(runs.map((r) => r.agent.type)));

  // Grouper par jour
  const dayMap = new Map<string, Map<string, number>>();

  for (const run of runs) {
    const d = new Date(run.createdAt);
    const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
    if (!dayMap.has(key)) dayMap.set(key, new Map());
    const typeMap = dayMap.get(key)!;
    typeMap.set(run.agent.type, (typeMap.get(run.agent.type) ?? 0) + run.creditsUsed);
  }

  // Générer tous les jours de la période
  const days: string[] = [];
  const end = new Date();
  const cursor = new Date(periodStart);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    days.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  const data: TimelinePoint[] = days.map((day) => {
    const typeMap = dayMap.get(day) ?? new Map();
    const point: TimelinePoint = {
      date: new Date(day + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      fullDate: day,
    };
    for (const type of agentTypes) {
      point[type] = typeMap.get(type) ?? 0;
    }
    return point;
  });

  return { data, agentTypes };
}
