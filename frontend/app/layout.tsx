import type { Metadata } from "next";
import { Syne } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import TrendDetailModal from "@/components/TrendDetailModal";
import { Suspense } from "react";
import { PageTransitionProvider } from "@/components/PageTransition";
import AppShell from "@/components/AppShell";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Augure - Analyse Culturelle Intergénérationnelle",
  description: "Décryptez les micro-tendances web et ne vous sentez plus jamais en décalage culturel.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Augure",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${syne.variable} h-full antialiased`}
      style={{ overflowX: 'hidden' }}
    >
      <body className="min-h-full flex flex-col font-syne bg-[var(--color-background-app)] pb-16 md:pb-0 overflow-x-hidden">
        <PageTransitionProvider>
          <AppShell>
            {children}
          </AppShell>
          <Suspense fallback={null}>
            <TrendDetailModal />
          </Suspense>
          <BottomNav />
        </PageTransitionProvider>
      </body>
    </html>
  );
}
