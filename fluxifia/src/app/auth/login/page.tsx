"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { LogoLoader } from "@/components/LogoLoader";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get("error");

    if (authError === "OAuthCallback") {
      setError("Connexion Microsoft impossible. Vérifiez le secret client Azure AD configuré dans l'application.");
    } else if (authError) {
      setError("La connexion a échoué. Veuillez réessayer.");
    }
  }, []);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <LogoLoader />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Bot size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">Fluxifia</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Bon retour 👋</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Connectez-vous à votre espace</p>
        </div>

        <div className="card">
          <button
            type="button"
            onClick={() => {
              setError("");
              setMicrosoftLoading(true);
              signIn("azure-ad", { callbackUrl: "/dashboard" });
            }}
            className="btn-secondary w-full flex items-center justify-center gap-2 mb-5"
            disabled={microsoftLoading}
          >
            {microsoftLoading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            Continuer avec Microsoft
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>ou</span>
            <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="input"
                placeholder="vous@entreprise.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Mot de passe</label>
                <Link href="/auth/forgot" className="text-xs" style={{ color: "var(--accent-light)" }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-center py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Se connecter
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Pas encore de compte ?{" "}
          <Link href="/auth/register" style={{ color: "var(--accent-light)" }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
