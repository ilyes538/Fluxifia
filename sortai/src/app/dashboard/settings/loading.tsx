import { LogoLoader } from "@/components/LogoLoader";

export default function SettingsLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center" style={{ background: "var(--background)" }}>
      <LogoLoader />
    </div>
  );
}
