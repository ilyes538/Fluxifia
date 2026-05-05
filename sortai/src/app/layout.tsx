import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "SortAI — IA pour les PME", template: "%s | SortAI" },
  description:
    "Automatisez vos emails, connectez vos outils et déployez des agents IA dans votre entreprise en quelques minutes.",
  keywords: ["IA", "PME", "automatisation", "agents IA", "email IA", "SaaS"],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "SortAI",
    title: "SortAI — IA pour les PME",
    description: "Automatisez vos emails, connectez vos outils et déployez des agents IA.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
