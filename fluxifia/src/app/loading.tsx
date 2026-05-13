import { LogoLoader } from "@/components/LogoLoader";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <LogoLoader />
    </div>
  );
}
