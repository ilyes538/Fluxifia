"use client";

import type { AgentUsage, TimelinePoint } from "@/lib/dashboard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmt = (value: any, name: any) => [`${value} crédit${Number(value) > 1 ? "s" : ""}`, name];

const AGENT_COLORS: Record<string, string> = {
  email: "#7c3aed",
  slack: "#4A154B",
  notion: "#ffffff",
  calendar: "#EA4335",
  lead: "#3b82f6",
  support: "#10b981",
};

export function CreditUsageChart({
  usages,
  timelineData,
  timelineAgents,
}: {
  usages: AgentUsage[];
  timelineData: TimelinePoint[];
  timelineAgents: string[];
}) {
  const total = usages.reduce((sum, u) => sum + u.creditsUsed, 0);

  if (total === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aucun crédit utilisé ce mois</p>
      </div>
    );
  }

  const max = Math.max(...usages.map((u) => u.creditsUsed));

  return (
    <div className="card space-y-6">
      {/* Timeline chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Utilisation des crédits</h3>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {total.toLocaleString("fr-FR")} crédit{total > 1 ? "s" : ""} utilisé{total > 1 ? "s" : ""}
          </span>
        </div>

        {timelineData.length > 0 && (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {timelineAgents.map((type) => (
                    <linearGradient key={type} id={`grad-${type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={AGENT_COLORS[type] ?? "#6b7280"} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={AGENT_COLORS[type] ?? "#6b7280"} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: 12,
                    color: "#fff",
                  }}
                  itemStyle={{ fontSize: 12 }}
                  formatter={fmt}
                />
                {timelineAgents.map((type) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stackId="1"
                    stroke={AGENT_COLORS[type] ?? "#6b7280"}
                    fill={`url(#grad-${type})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Breakdown by agent */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Répartition par agent</h4>
        {usages.map((u) => {
          const pct = Math.round((u.creditsUsed / max) * 100);
          return (
            <div key={u.type} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: u.color }} />
                  {u.name}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{u.creditsUsed.toLocaleString("fr-FR")} crédit{u.creditsUsed > 1 ? "s" : ""}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: u.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
