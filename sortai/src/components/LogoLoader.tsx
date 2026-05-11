"use client";

import { useState, useEffect } from "react";

interface Props {
  size?: number;
  duration?: number;
}

export function LogoLoader({ size = 80, duration = 2000 }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [duration]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background: grayscale logo */}
        <div
          className="absolute inset-0 grayscale opacity-30"
          style={{
            backgroundImage: "url('/F_logo.png')",
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Foreground: color logo, rising from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 overflow-hidden transition-none"
          style={{ height: `${progress}%` }}
        >
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: size,
              backgroundImage: "url('/F_logo.png')",
              backgroundSize: "contain",
              backgroundPosition: "center bottom",
              backgroundRepeat: "no-repeat",
              filter: "drop-shadow(0 0 8px rgba(124,58,237,0.6))",
            }}
          />
        </div>
      </div>

      <div className="w-32 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full rounded-full transition-none"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #7c3aed, #a855f7)",
          }}
        />
      </div>
    </div>
  );
}
