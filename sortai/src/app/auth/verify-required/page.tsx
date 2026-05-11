"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function VerifyRequiredPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md card space-y-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--accent-glow)" }}>
          <Mail size={28} style={{ color: "var(--accent-light)" }} />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold">Vérifiez votre email</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Un lien de vérification a été envoyé à <strong>{session?.user?.email}</strong>.<br />
            Cliquez sur le lien pour activer votre compte.
          </p>
        </div>

        {sent ? (
          <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
            <CheckCircle size={16} />
            <span>Lien renvoyé ! Vérifiez votre console (dev mode).</span>
          </div>
        ) : (
          <button
            onClick={resend}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            {loading ? "Envoi..." : "Renvoyer le lien"}
          </button>
        )}

        {error && (
          <div className="flex items-center justify-center gap-2 text-sm text-red-400">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          En mode développement, le lien s&apos;affiche dans la console du serveur.
        </p>
      </div>
    </div>
  );
}
