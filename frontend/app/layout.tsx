import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans, Space_Grotesk } from "next/font/google";

import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SnapKey CRM | Social Publishing",
  description: "Social publishing module for SnapKey CRM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <div className="shell">
          <header className="topbar">
            <div className="brand">
              <div className="brand-kicker">SnapKey CRM</div>
              <h1>Social Publishing</h1>
              <p>
                Connect channels, prepare campaign content, and monitor scheduled execution inside
                the SnapKey operating workspace.
              </p>
            </div>
            <nav className="nav">
              <Link href="/">Dashboard</Link>
              <Link href="/posts">Scheduled Posts</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
