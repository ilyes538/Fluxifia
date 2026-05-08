"use client";

import { useState } from "react";
import { Mail, ArrowLeft, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { EmailPreview, parseSender, formatDate, avatarGradient } from "@/lib/email-utils";

export function EmailSelection({
  preview,
  count,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onGenerate,
  onBack,
}: {
  preview: EmailPreview[];
  count: number;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onGenerate: () => void;
  onBack: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const allSelected = preview.length > 0 && selectedIds.size === preview.length;

  const paginated = preview.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(preview.length / ITEMS_PER_PAGE);

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Sélectionnez les emails</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {selectedIds.size} / {count} sélectionné{selectedIds.size > 1 ? "s" : ""} — 1 email = 1 crédit
          </p>
        </div>
      </div>

      {preview.length === 0 ? (
        <div className="card text-center py-12">
          <Mail size={32} style={{ color: "var(--text-muted)", margin: "0 auto" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>Aucun email à afficher.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="text-sm flex items-center gap-3 hover:text-white transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${allSelected ? "border-purple-500 bg-purple-600" : "border-white/20"}`}>
                {allSelected && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className="text-white">{allSelected ? "Tout désélectionner" : "Tout sélectionner"}</span>
            </button>
            <span className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
              {selectedIds.size} crédit{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
          </div>

          {/* List */}
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {paginated.map((email) => {
              const sender = parseSender(email.from);
              const isSelected = selectedIds.has(email.gmailId);
              return (
                <div
                  key={email.gmailId}
                  onClick={() => onToggle(email.gmailId)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${isSelected ? "bg-purple-500/5" : "hover:bg-white/[0.02]"}`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? "border-purple-500 bg-purple-600" : "border-white/20"}`}>
                    {isSelected && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: avatarGradient(sender.name) }}>
                    {sender.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{sender.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{email.subject || "(Sans sujet)"}</p>
                  </div>
                  <span className="text-xs whitespace-nowrap shrink-0" style={{ color: "var(--text-muted)" }}>{formatDate(email.date)}</span>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all disabled:opacity-30 hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                &lt;
              </button>
              {pages.map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="text-xs" style={{ color: "var(--text-muted)" }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all"
                    style={{ background: currentPage === p ? "var(--accent)" : "transparent", color: currentPage === p ? "#fff" : "var(--text-muted)" }}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all disabled:opacity-30 hover:bg-white/5"
                style={{ color: "var(--text-muted)" }}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bottom action */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onGenerate}
          disabled={selectedIds.size === 0}
          className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: selectedIds.size > 0 ? "linear-gradient(135deg, #7c3aed, #6366f1)" : "rgba(255,255,255,0.06)",
            color: "#fff",
            boxShadow: selectedIds.size > 0 ? "0 4px 24px rgba(124,58,237,0.25)" : "none",
          }}
        >
          <Sparkles size={14} /> Générer le compte rendu ({selectedIds.size} crédit{selectedIds.size > 1 ? "s" : ""})
        </button>
        <div className="flex items-center justify-between text-[11px] px-1" style={{ color: "var(--text-muted)" }}>
          <span>Vous générerez un compte rendu pour {selectedIds.size} email{selectedIds.size > 1 ? "s" : ""} sélectionné{selectedIds.size > 1 ? "s" : ""}.</span>
          <span>{selectedIds.size} crédit{selectedIds.size > 1 ? "s" : ""} seront utilisés</span>
        </div>
      </div>
    </div>
  );
}
