"use client";

import { Bell, Building2 } from "lucide-react";

interface Props {
  user: { name?: string | null; email: string; orgName: string | null };
}

export function DashboardHeader({ user }: Props) {
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div>
        {user.orgName && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
            <Building2 size={13} />
            <span>{user.orgName}</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-all relative"
          style={{ color: "var(--text-muted)" }}>
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
          {initials}
        </div>
      </div>
    </header>
  );
}
