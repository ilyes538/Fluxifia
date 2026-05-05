"use client";

import { useState } from "react";
import { Search, Download, Plus, Trash2, Play, Filter, X, Loader2, FileSpreadsheet, Tag, ChevronDown } from "lucide-react";

const CATEGORIES = ["support", "commercial", "urgent", "newsletter", "internal", "other"];
const ALL_COLUMNS = [
  { key: "subject", label: "Sujet" },
  { key: "from", label: "Expéditeur" },
  { key: "to", label: "Destinataire" },
  { key: "category", label: "Catégorie" },
  { key: "action", label: "Action IA" },
  { key: "aiResponse", label: "Réponse IA" },
  { key: "createdAt", label: "Date" },
];

interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  keywords: string[];
  fromFilter: string | null;
  categories: string[];
  columns: string[];
  outputName: string;
  lastRunAt: Date | null;
  lastCount: number;
}

interface Props {
  rules: Rule[];
  categoryStats: { category: string | null; _count: { id: number } }[];
  total: number;
}

type Tab = "explorer" | "extractions";

export function EmailsClient({ rules: initialRules, categoryStats, total }: Props) {
  const [tab, setTab] = useState<Tab>("explorer");

  // Explorer state
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [emails, setEmails] = useState<Record<string, unknown>[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchTotal, setSearchTotal] = useState<number | null>(null);
  const [exportCols, setExportCols] = useState(["subject", "from", "category", "action", "createdAt"]);
  const [exporting, setExporting] = useState(false);

  // Rules state
  const [rules, setRules] = useState(initialRules);
  const [showNewRule, setShowNewRule] = useState(false);
  const [ruleLoading, setRuleLoading] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ count: number; rows: Record<string, unknown>[] } | null>(null);
  const [previewRuleId, setPreviewRuleId] = useState<string | null>(null);

  // New rule form
  const [newRule, setNewRule] = useState({
    name: "",
    keywords: "",
    fromFilter: "",
    categories: [] as string[],
    columns: ["subject", "from", "category", "action", "createdAt"],
    outputName: "extraction",
  });

  // ── Explorer ──────────────────────────────────────────────────────────────

  async function searchEmails() {
    setLoadingSearch(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterCategory) params.set("category", filterCategory);
    if (filterFrom) params.set("from", filterFrom);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    const res = await fetch(`/api/emails?${params}`);
    const data = await res.json();
    setEmails(data.logs ?? []);
    setSearchTotal(data.total ?? 0);
    setLoadingSearch(false);
  }

  async function exportCurrent() {
    setExporting(true);
    const keywords = search ? [search] : [];
    const res = await fetch("/api/emails/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        fromFilter: filterFrom,
        categories: filterCategory ? [filterCategory] : [],
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        columns: exportCols,
        filename: `emails-${filterCategory || "tous"}`,
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emails-export-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  // ── Rules ─────────────────────────────────────────────────────────────────

  async function createRule() {
    setRuleLoading("new");
    const res = await fetch("/api/emails/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newRule.name,
        keywords: newRule.keywords.split(",").map((k) => k.trim()).filter(Boolean),
        fromFilter: newRule.fromFilter || undefined,
        categories: newRule.categories,
        columns: newRule.columns,
        outputName: newRule.outputName,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setRules([{ ...data.rule, keywords: JSON.parse(data.rule.keywords), categories: JSON.parse(data.rule.categories), columns: JSON.parse(data.rule.columns) }, ...rules]);
      setShowNewRule(false);
      setNewRule({ name: "", keywords: "", fromFilter: "", categories: [], columns: ["subject", "from", "category", "action", "createdAt"], outputName: "extraction" });
    }
    setRuleLoading(null);
  }

  async function deleteRule(id: string) {
    setRuleLoading(id);
    await fetch("/api/emails/rules", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setRules(rules.filter((r) => r.id !== id));
    setRuleLoading(null);
  }

  async function toggleRule(id: string, enabled: boolean) {
    await fetch("/api/emails/rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, enabled }) });
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled } : r)));
  }

  async function runRule(ruleId: string, preview = false) {
    setRuleLoading(ruleId);
    const res = await fetch("/api/emails/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ruleId, preview }),
    });
    const data = await res.json();
    setRuleLoading(null);

    if (!preview && res.ok) {
      // Export Excel depuis les résultats
      const rule = rules.find((r) => r.id === ruleId)!;
      const exportRes = await fetch("/api/emails/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: rule.keywords,
          fromFilter: rule.fromFilter,
          categories: rule.categories,
          columns: rule.columns,
          filename: rule.outputName,
        }),
      });
      if (exportRes.ok) {
        const blob = await exportRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${rule.outputName}-${Date.now()}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setRules(rules.map((r) => r.id === ruleId ? { ...r, lastCount: data.count, lastRunAt: new Date() } : r));
    } else if (preview) {
      setPreviewData({ count: data.count, rows: data.rows });
      setPreviewRuleId(ruleId);
    }
  }

  const CATEGORY_COLORS: Record<string, string> = {
    support: "#38bdf8", commercial: "#34d399", urgent: "#f87171",
    newsletter: "#a78bfa", internal: "#fbbf24", other: "var(--text-muted)",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Emails</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {total.toLocaleString("fr-FR")} emails traités au total
        </p>
      </div>

      {/* Stats catégories */}
      <div className="flex flex-wrap gap-2">
        {categoryStats.map((s) => (
          <button
            key={s.category}
            onClick={() => { setFilterCategory(filterCategory === (s.category ?? "") ? "" : (s.category ?? "")); setTab("explorer"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filterCategory === s.category ? CATEGORY_COLORS[s.category ?? "other"] + "33" : "var(--card-bg)",
              border: "1px solid",
              borderColor: filterCategory === s.category ? CATEGORY_COLORS[s.category ?? "other"] : "var(--border)",
              color: CATEGORY_COLORS[s.category ?? "other"],
            }}
          >
            <Tag size={10} />
            {s.category ?? "other"} ({s._count.id})
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--card-bg)" }}>
        {(["explorer", "extractions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all capitalize"
            style={{
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#fff" : "var(--text-muted)",
            }}
          >
            {t === "explorer" ? "🔍 Explorer" : "⚡ Règles d'extraction"}
          </button>
        ))}
      </div>

      {/* ── Explorer tab ── */}
      {tab === "explorer" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Filter size={14} style={{ color: "var(--accent-light)" }} />
              <span className="font-medium text-sm">Filtres</span>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Mot-clé (sujet)</label>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input className="input pl-8 w-full text-sm" placeholder="facture, devis, urgent..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchEmails()} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Expéditeur contient</label>
                <input className="input w-full text-sm" placeholder="@amazon.com, jean..." value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Catégorie</label>
                <div className="relative">
                  <select className="input w-full appearance-none text-sm pr-8" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">Toutes</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Date début</label>
                <input type="date" className="input w-full text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Date fin</label>
                <input type="date" className="input w-full text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            {/* Export columns */}
            <div>
              <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Colonnes à exporter</label>
              <div className="flex flex-wrap gap-2">
                {ALL_COLUMNS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setExportCols(exportCols.includes(c.key) ? exportCols.filter((x) => x !== c.key) : [...exportCols, c.key])}
                    className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: exportCols.includes(c.key) ? "var(--accent)" : "rgba(255,255,255,0.05)",
                      color: exportCols.includes(c.key) ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={searchEmails} disabled={loadingSearch} className="btn-primary flex items-center gap-2 text-sm">
                {loadingSearch ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                Rechercher
              </button>
              <button onClick={exportCurrent} disabled={exporting} className="btn-secondary flex items-center gap-2 text-sm">
                {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Exporter Excel
              </button>
              {(search || filterCategory || filterFrom || dateFrom || dateTo) && (
                <button onClick={() => { setSearch(""); setFilterCategory(""); setFilterFrom(""); setDateFrom(""); setDateTo(""); setEmails([]); setSearchTotal(null); }} className="btn-secondary text-sm flex items-center gap-1">
                  <X size={14} /> Effacer
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          {searchTotal !== null && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">{searchTotal} résultat(s)</span>
                {emails.length < searchTotal && <span className="text-xs" style={{ color: "var(--text-muted)" }}>Affichage des 50 premiers</span>}
              </div>
              {emails.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: "var(--text-muted)" }}>Aucun email trouvé</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Sujet</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>De</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Catégorie</th>
                        <th className="text-left py-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emails.map((e: Record<string, unknown>) => (
                        <tr key={e.id as string} className="border-b last:border-0 hover:bg-white/5 transition-colors" style={{ borderColor: "var(--border)" }}>
                          <td className="py-2.5 pr-4 max-w-xs truncate">{(e.subject as string) ?? "Sans sujet"}</td>
                          <td className="py-2.5 pr-4 text-xs max-w-[160px] truncate" style={{ color: "var(--text-muted)" }}>{(e.from as string) ?? "—"}</td>
                          <td className="py-2.5 pr-4">
                            {e.category && (
                              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: (CATEGORY_COLORS[e.category as string] ?? "#999") + "22", color: CATEGORY_COLORS[e.category as string] ?? "#999" }}>
                                {e.category as string}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            {e.createdAt ? new Date(e.createdAt as string).toLocaleDateString("fr-FR") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Extractions tab ── */}
      {tab === "extractions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Créez des règles d&apos;extraction réutilisables → téléchargement Excel en 1 clic
            </p>
            <button onClick={() => setShowNewRule(!showNewRule)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} />
              Nouvelle règle
            </button>
          </div>

          {/* New rule form */}
          {showNewRule && (
            <div className="card space-y-4" style={{ borderColor: "rgba(124,58,237,0.4)" }}>
              <h3 className="font-semibold">Nouvelle règle d&apos;extraction</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Nom de la règle *</label>
                  <input className="input w-full text-sm" placeholder="Factures Amazon, Leads chauds..." value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Nom du fichier Excel</label>
                  <input className="input w-full text-sm" placeholder="extraction-factures" value={newRule.outputName} onChange={(e) => setNewRule({ ...newRule, outputName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Mots-clés dans le sujet (virgule)</label>
                  <input className="input w-full text-sm" placeholder="facture, invoice, bon de commande" value={newRule.keywords} onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>Expéditeur contient</label>
                  <input className="input w-full text-sm" placeholder="@amazon.com, noreply..." value={newRule.fromFilter} onChange={(e) => setNewRule({ ...newRule, fromFilter: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Catégories à inclure</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewRule({ ...newRule, categories: newRule.categories.includes(c) ? newRule.categories.filter((x) => x !== c) : [...newRule.categories, c] })}
                      className="px-3 py-1 rounded-full text-xs transition-all"
                      style={{ background: newRule.categories.includes(c) ? CATEGORY_COLORS[c] + "33" : "rgba(255,255,255,0.05)", color: newRule.categories.includes(c) ? CATEGORY_COLORS[c] : "var(--text-muted)", border: "1px solid", borderColor: newRule.categories.includes(c) ? CATEGORY_COLORS[c] : "var(--border)" }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs mb-2" style={{ color: "var(--text-muted)" }}>Colonnes dans le fichier Excel</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_COLUMNS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setNewRule({ ...newRule, columns: newRule.columns.includes(c.key) ? newRule.columns.filter((x) => x !== c.key) : [...newRule.columns, c.key] })}
                      className="px-3 py-1 rounded-full text-xs transition-all"
                      style={{ background: newRule.columns.includes(c.key) ? "var(--accent)" : "rgba(255,255,255,0.05)", color: newRule.columns.includes(c.key) ? "#fff" : "var(--text-muted)" }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={createRule} disabled={!newRule.name || ruleLoading === "new"} className="btn-primary flex items-center gap-2 text-sm">
                  {ruleLoading === "new" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Créer la règle
                </button>
                <button onClick={() => setShowNewRule(false)} className="btn-secondary text-sm">Annuler</button>
              </div>
            </div>
          )}

          {/* Rules list */}
          {rules.length === 0 && !showNewRule ? (
            <div className="card text-center py-10">
              <FileSpreadsheet size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aucune règle créée. Créez-en une pour extraire automatiquement vos emails.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${rule.enabled ? "bg-green-500" : "bg-gray-600"}`} />
                        <h3 className="font-medium">{rule.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {rule.keywords.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.15)", color: "var(--accent-light)" }}>
                            🔑 {rule.keywords.join(", ")}
                          </span>
                        )}
                        {rule.fromFilter && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8" }}>
                            📬 {rule.fromFilter}
                          </span>
                        )}
                        {rule.categories.map((c) => (
                          <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: CATEGORY_COLORS[c] + "22", color: CATEGORY_COLORS[c] }}>
                            {c}
                          </span>
                        ))}
                      </div>
                      {rule.lastRunAt && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          Dernière extraction : {new Date(rule.lastRunAt).toLocaleDateString("fr-FR")} — {rule.lastCount} emails
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleRule(rule.id, !rule.enabled)} className="relative w-9 h-5 rounded-full transition-all" style={{ background: rule.enabled ? "var(--accent)" : "rgba(255,255,255,0.1)" }}>
                        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: rule.enabled ? "calc(100% - 1.1rem)" : "0.125rem" }} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runRule(rule.id, true)}
                      disabled={ruleLoading === rule.id}
                      className="btn-secondary text-xs flex items-center gap-1.5"
                    >
                      {ruleLoading === rule.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      Aperçu
                    </button>
                    <button
                      onClick={() => runRule(rule.id, false)}
                      disabled={ruleLoading === rule.id}
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      {ruleLoading === rule.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      Extraire → Excel
                    </button>
                    <button
                      onClick={() => deleteRule(rule.id)}
                      disabled={ruleLoading === rule.id}
                      className="ml-auto text-xs flex items-center gap-1 hover:text-red-400 transition-colors"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Preview */}
                  {previewRuleId === rule.id && previewData && (
                    <div className="mt-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">{previewData.count} email(s) correspondant(s)</span>
                        <button onClick={() => { setPreviewData(null); setPreviewRuleId(null); }} className="text-xs" style={{ color: "var(--text-muted)" }}>Fermer</button>
                      </div>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {previewData.rows.map((r: Record<string, unknown>) => (
                          <div key={r.id as string} className="flex items-center gap-3 py-1 text-xs">
                            <span className="truncate max-w-xs">{(r.subject as string) ?? "Sans sujet"}</span>
                            <span style={{ color: "var(--text-muted)" }} className="shrink-0">{(r.from as string) ?? "—"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
