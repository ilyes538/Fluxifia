"use client";

export function MockupBrowser({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden border shadow-2xl"
      style={{
        background: "#111118",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(124,58,237,0.1)",
      }}
    >
      <div
        className="h-6 px-3 flex items-center gap-1.5"
        style={{ background: "#0e0e14", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#eab308" }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e" }} />
      </div>
      {children}
    </div>
  );
}
