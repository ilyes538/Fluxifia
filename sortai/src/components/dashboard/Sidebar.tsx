"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, LayoutDashboard, Zap, Plug, CreditCard, Settings, LogOut, Users, Mail } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/agents", label: "Agents IA", icon: Bot },
  { href: "/dashboard/emails", label: "Emails IA", icon: Mail },
  { href: "/dashboard/integrations", label: "Intégrations", icon: Plug },
  { href: "/dashboard/usage", label: "Utilisation", icon: Zap },
  { href: "/dashboard/billing", label: "Abonnement", icon: CreditCard },
  { href: "/dashboard/settings/team", label: "Équipe", icon: Users },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col border-r z-40 hidden md:flex"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
            <Bot size={16} className="text-white" />
          </div>
          <span className="font-bold">SortAI</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active ? "text-white" : "hover:bg-white/5"
              )}
              style={active
                ? { background: "var(--accent-glow)", color: "var(--accent-light)", borderLeft: "2px solid var(--accent)" }
                : { color: "var(--text-muted)" }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
