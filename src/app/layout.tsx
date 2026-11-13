import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { OfflineCleanup } from "@/components/OfflineCleanup";
import { ThemeScript } from "@/components/ThemeScript";
import { SupportPrompt } from "@/components/SupportPrompt";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Residue Lens | Compare pesticide residues in food", template: "%s" },
  description:
    "Explore official UK, US and European pesticide residue results, including organic comparisons and transparent methodology.",
  applicationName: "Residue Lens",
  category: "education",
  keywords: ["pesticide residues", "organic food", "food monitoring", "MRL", "fruit and vegetables"],
  authors: [{ name: "Residue Lens" }],
  openGraph: { type: "website", locale: "en_GB", siteName: "Residue Lens" },
  twitter: { card: "summary_large_image" },
  robots: process.env.NEXT_PUBLIC_PUBLIC_LAUNCH === "true"
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>{children}<SupportPrompt /><OfflineCleanup /><AnalyticsProvider /><SpeedInsights /></body>
    </html>
  );
}
