import { LogoLoader } from "@/components/LogoLoader";

export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <LogoLoader />
    </div>
  );
}
