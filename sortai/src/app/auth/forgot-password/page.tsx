"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue");
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-gray-400 mt-2">Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        {submitted ? (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 text-center">
            <p className="text-green-400">Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.</p>
            <Link href="/auth/login" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-8 space-y-4">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                placeholder="vous@entreprise.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-lg transition"
            >
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>
            <Link href="/auth/login" className="block text-center text-sm text-gray-400 hover:text-gray-300">
              Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
