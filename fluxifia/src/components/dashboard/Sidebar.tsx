"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Plug,
  CreditCard,
  Settings,
  LogOut,
  Users,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

const nav = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/emails", label: "Agent Email", icon: Mail },
  { href: "/dashboard/integrations", label: "Agents & Intégrations", icon: Plug },
  { href: "/dashboard/usage", label: "Utilisation", icon: Zap },
  { href: "/dashboard/billing", label: "Abonnement", icon: CreditCard },
  { href: "/dashboard/settings/team", label: "Équipe", icon: Users },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggleCollapsed, closeMobile } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col border-r transition-all duration-300 ease-in-out",
          "-translate-x-full md:translate-x-0",
          mobileOpen && "translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          "w-64"
        )}
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Logo + toggle */}
        <div
          className={cn(
            "h-16 flex items-center border-b shrink-0",
            collapsed ? "md:px-2 md:justify-center" : "px-6",
            "px-6"
          )}
          style={{ borderColor: "var(--border)" }}
        >
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <Image
              src="/F_logo.png"
              alt="Fluxifia"
              width={60}
              height={60}
              className={cn(
                "rounded-lg shrink-0 transition-all duration-300",
                "w-[60px] h-[60px]",
                collapsed && "md:w-10 md:h-10"
              )}
            />
            <span
              className={cn(
                "font-bold whitespace-nowrap transition-opacity duration-300",
                collapsed ? "md:opacity-0 md:w-0" : "opacity-100"
              )}
            >
              Fluxifia
            </span>
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="ml-auto hidden md:flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/10 transition-colors"
            style={{ color: "var(--text-muted)" }}
            title={collapsed ? "Agrandir" : "Réduire"}
          >
            {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-all",
                  collapsed ? "md:justify-center md:px-2 py-2.5" : "px-3 py-2.5",
                  active ? "text-white" : "hover:bg-white/5"
                )}
                style={
                  active
                    ? {
                        background: "var(--accent-glow)",
                        color: "var(--accent-light)",
                        borderLeft: collapsed ? undefined : "2px solid var(--accent)",
                      }
                    : { color: "var(--text-muted)" }
                }
              >
                <Icon size={16} className="shrink-0" />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-300",
                    collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title={collapsed ? "Se déconnecter" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg text-sm w-full transition-all hover:bg-white/5",
              collapsed ? "md:justify-center md:px-2 py-2.5" : "px-3 py-2.5"
            )}
            style={{ color: "var(--text-muted)" }}
          >
            <LogOut size={16} className="shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap transition-opacity duration-300",
                collapsed ? "md:opacity-0 md:w-0 md:hidden" : "opacity-100"
              )}
            >
              Se déconnecter
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
