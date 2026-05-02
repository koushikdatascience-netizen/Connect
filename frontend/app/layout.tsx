import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import { AppShellUx } from "@/components/app-shell-ux";
import { AuthGate } from "@/components/auth-gate";

import "./globals.css";

/* ✅ GOOGLE FONTS (SAFE MODE) */
const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapKey CRM | Social Publishing",
  description: "Social publishing module for SnapKey CRM.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <AuthGate>
          <AppShellUx>{children}</AppShellUx>
        </AuthGate>
      </body>
    </html>
  );
}