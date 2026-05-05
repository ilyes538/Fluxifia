"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bot, Eye, EyeOff, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "company">("account");
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    orgName: "", industry: "", size: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === "account") { setStep("company"); return; }
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Erreur lors de l'inscription."); return; }
    router.push("/auth/login?registered=1");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <Bot size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">SortAI</span>
          </Link>
          <h1 className="text-2xl font-bold mb-1">Créer votre compte</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Gratuit · Aucune carte bancaire</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          {["Compte", "Entreprise"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                (i === 0 && step === "account") || (i === 1 && step === "company")
                  ? "text-white" : i === 0 && step === "company" ? "" : ""
              }`}
                style={{
                  background: i === 0 && step === "company"
                    ? "var(--green)"
                    : (i === 0 && step === "account") || (i === 1 && step === "company")
                    ? "var(--accent)"
                    : "rgba(255,255,255,0.1)",
                  color: i === 0 && step === "company" ? "white" : undefined,
                }}
              >
                {i === 0 && step === "company" ? <Check size={12} /> : i + 1}
              </div>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{s}</span>
              {i === 0 && <div className="w-8 h-px" style={{ background: "var(--border)" }} />}
            </div>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {step === "account" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Votre nom</label>
                  <input className="input" placeholder="Jean Dupont" value={form.name} onChange={(e) => set("name", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email professionnel</label>
                  <input type="email" className="input" placeholder="jean@entreprise.fr" value={form.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mot de passe</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} className="input pr-10" placeholder="Minimum 8 caractères" value={form.password}
                      onChange={(e) => set("password", e.target.value)} required minLength={8} autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Nom de l&apos;entreprise</label>
                  <input className="input" placeholder="Acme SAS" value={form.orgName} onChange={(e) => set("orgName", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Secteur d&apos;activité</label>
                  <select className="input" value={form.industry} onChange={(e) => set("industry", e.target.value)} required style={{ appearance: "none" }}>
                    <option value="">Sélectionner…</option>
                    <option>Commerce & Distribution</option>
                    <option>Services B2B</option>
                    <option>Industrie & BTP</option>
                    <option>Santé & Bien-être</option>
                    <option>Restauration & Hôtellerie</option>
                    <option>Tech & SaaS</option>
                    <option>Immobilier</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Taille de l&apos;équipe</label>
                  <select className="input" value={form.size} onChange={(e) => set("size", e.target.value)} required style={{ appearance: "none" }}>
                    <option value="">Sélectionner…</option>
                    <option>1 - 10</option>
                    <option>11 - 50</option>
                    <option>51 - 200</option>
                    <option>200+</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="text-sm text-center py-2 px-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {step === "account" ? "Continuer" : "Créer mon compte"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Déjà un compte ?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent-light)" }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
