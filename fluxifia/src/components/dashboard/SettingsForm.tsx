"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  user: { id: string; name: string; email: string };
  org: { id: string; name: string; industry: string; size: string } | null;
}

export function SettingsForm({ user, org }: Props) {
  const [name, setName] = useState(user.name);
  const [orgName, setOrgName] = useState(org?.name ?? "");
  const [industry, setIndustry] = useState(org?.industry ?? "");
  const [size, setSize] = useState(org?.size ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, orgName, industry, size }),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Profil</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Votre nom</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jean Dupont" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input className="input opacity-60 cursor-not-allowed" value={user.email} readOnly />
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>L&apos;email ne peut pas être modifié</p>
        </div>
      </div>

      {/* Company */}
      {org && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Entreprise</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Nom de l&apos;entreprise</label>
            <input className="input" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Secteur</label>
              <select className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} style={{ appearance: "none" }}>
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
              <label className="block text-sm font-medium mb-2">Taille</label>
              <select className="input" value={size} onChange={(e) => setSize(e.target.value)} style={{ appearance: "none" }}>
                <option value="">Sélectionner…</option>
                <option>1 - 10</option>
                <option>11 - 50</option>
                <option>51 - 200</option>
                <option>200+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Enregistrer
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm" style={{ color: "var(--green)" }}>
            <CheckCircle2 size={14} /> Sauvegardé
          </span>
        )}
      </div>
    </form>
  );
}
