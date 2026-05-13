"use client";

import { useState } from "react";
import { UserPlus, Loader2, Crown, Shield, User } from "lucide-react";

interface Member {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
}

interface Props {
  members: Member[];
  currentUserId: string;
  currentUserRole: string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  owner: <Crown size={12} style={{ color: "#fbbf24" }} />,
  admin: <Shield size={12} style={{ color: "var(--accent-light)" }} />,
  member: <User size={12} style={{ color: "var(--text-muted)" }} />,
};

export function TeamManager({ members, currentUserId, currentUserRole }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canInvite = currentUserRole === "owner" || currentUserRole === "admin";

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'invitation");
    } else {
      setMessage(`Invitation envoyée à ${email}`);
      setEmail("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Members list */}
      <div className="card">
        <h2 className="font-semibold mb-4">{members.length} membre(s)</h2>
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  {(m.name ?? m.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{m.name ?? "—"}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 badge badge-gray capitalize">
                  {ROLE_ICONS[m.role]}
                  {m.role}
                </span>
                {m.id === currentUserId && (
                  <span className="badge badge-violet text-xs">Vous</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}
      {canInvite && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <UserPlus size={16} style={{ color: "var(--accent-light)" }} />
            Inviter un membre
          </h2>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          {message && <p className="text-sm text-green-400 mb-3">{message}</p>}
          <form onSubmit={invite} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="collaborateur@entreprise.com"
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Rôle</label>
              <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "member")} className="input w-full">
                <option value="member">Membre — accès standard</option>
                <option value="admin">Admin — peut inviter et configurer</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Envoyer l&apos;invitation
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
