"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

import { clearStoredAuthToken, logoutSession } from "@/lib/api";

const navigation = [
  { href: "/compose", label: "Compose Post", icon: "compose" },
  { href: "/posts", label: "Scheduled Posts", icon: "clock" },
  { href: "/connections", label: "Social Accounts", icon: "spark" },
] as const;

function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-[#e6cf7b] bg-[linear-gradient(135deg,#ffd84d,#f5c800)] shadow-[0_12px_26px_rgba(245,200,0,0.24)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-ink-900" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
        <path d="M7 12h10M12 7v10" />
        <path d="M4.5 9.5A2.5 2.5 0 0 1 7 7h2" />
        <path d="M19.5 14.5A2.5 2.5 0 0 1 17 17h-2" />
      </svg>
    </div>
  );
}

function NavIcon({ icon }: { icon: (typeof navigation)[number]["icon"] }) {
  const shared = { viewBox: "0 0 24 24", className: "h-5 w-5", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (icon === "compose") return <svg {...shared}><path d="M4.5 19.5h4l10-10a2.1 2.1 0 0 0-4-4l-10 10v4Z" /><path d="m13.5 6.5 4 4" /></svg>;
  if (icon === "spark") return <svg {...shared}><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="m6 6 2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /></svg>;
  if (icon === "clock") return <svg {...shared}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
  return <svg {...shared}><circle cx="12" cy="12" r="3" /><path d="M12 4.5v2.1M12 17.4v2.1M19.5 12h-2.1M6.6 12H4.5M17.3 6.7l-1.5 1.5M8.2 15.8l-1.5 1.5M17.3 17.3l-1.5-1.5M8.2 8.2 6.7 6.7" /></svg>;
}

export function AppShellUx({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    clearStoredAuthToken();
    try {
      await logoutSession();
    } catch {
      // Frontend logout should still work if cookie cleanup fails.
    }
    router.replace("/login");
  }

  if (pathname === "/login" || pathname === "/webview-auth") {
    return <>{children}</>;
  }

      return (
    <>
      <div className="sticky top-0 z-40 border-b border-[#2a2414] bg-[rgba(10,10,10,0.94)] px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3b3421] bg-[#151515] p-0 text-[#f4d24a] transition-colors hover:border-[#5a4b1e] hover:bg-[#1b1b1b]" aria-label="Open navigation">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <div className="flex items-center gap-3"><LogoMark /><div className="hidden sm:block"><div className="font-display text-xl font-semibold tracking-[-0.06em] text-white">Snapkey</div><div className="text-[10px] uppercase tracking-[0.22em] text-[#f4d24a]">Social Suite</div></div></div>
          <button type="button" onClick={() => router.push("/compose")} className="primary-button h-11 px-4 py-0 text-xs">+ New Post</button>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(17,17,17,0.32)] backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="h-full w-[84%] max-w-[320px] border-r border-[#2a2414] bg-[#0b0b0b] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.42)]" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><LogoMark /><div><div className="font-display text-2xl font-semibold tracking-[-0.06em] text-white">Snapkey</div><p className="text-xs uppercase tracking-[0.2em] text-[#f4d24a]">Workspace menu</p></div></div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#3b3421] bg-[#151515] p-0 text-[#f4d24a] transition-colors hover:border-[#5a4b1e] hover:bg-[#1b1b1b]" aria-label="Close navigation"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></button>
            </div>
            <nav className="space-y-2">{navigation.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${active ? "bg-[#1d1a10] text-[#f4d24a]" : "text-[#efe3aa] hover:bg-[#171717] hover:text-white"}`} onClick={() => setMobileMenuOpen(false)}><NavIcon icon={item.icon} /><span className="flex-1">{item.label}</span>{active ? <span className="h-2 w-2 rounded-full bg-[#f4d24a]" /> : null}</Link>;
            })}</nav>
            <button type="button" onClick={handleLogout} className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-[#3b3421] bg-[#151515] px-5 py-3 text-sm font-medium text-[#f4d24a] transition-colors hover:border-[#5a4b1e] hover:bg-[#1b1b1b]">Sign Out</button>
          </aside>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-4 px-3 pb-20 pt-5 sm:px-4 sm:pb-24 lg:px-6 lg:pb-5">
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col justify-between rounded-[28px] border border-[#2b2414] bg-[#0b0b0b] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.42)]">
            <div>
              <div className="mb-6 flex items-center gap-3"><LogoMark /><div><div className="font-display text-[22px] font-semibold tracking-[-0.06em] text-white">Snapkey</div><div className="text-[10px] uppercase tracking-[0.24em] text-[#f4d24a]">Social Suite</div></div></div>
              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                  return (
                    <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${active ? "bg-[#1d1a10] text-[#f4d24a] shadow-[0_10px_24px_rgba(0,0,0,0.28)]" : "text-[#efe3aa] hover:bg-[#171717] hover:text-white"}`}>
                      <NavIcon icon={item.icon} />
                      <span className="flex-1">{item.label}</span>
                      {active ? <span className="rounded-full bg-[#f4d24a] px-2 py-0.5 text-[11px] font-semibold text-[#09090e]">Active</span> : null}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-3">
              <button type="button" onClick={handleLogout} className="inline-flex w-full items-center justify-center rounded-full border border-[#3b3421] bg-[#151515] px-5 py-3 text-sm font-medium text-[#f4d24a] transition-colors hover:border-[#5a4b1e] hover:bg-[#1b1b1b]">Sign Out</button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[26px] border border-[#2b2414] bg-[rgba(10,10,10,0.96)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.3)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 gap-1">
          {navigation.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center rounded-[18px] px-2 py-2 text-[11px] font-medium ${active ? "bg-[#1d1a10] text-[#f4d24a]" : "text-[#d8cfa7] hover:bg-[#171717] hover:text-white"}`}>
                <NavIcon icon={item.icon} />
                <span className="mt-1">{item.label.replace("Scheduled ", "")}</span>
                {active ? <span className="mt-0.5 h-1 w-1 rounded-full bg-[#f4d24a] block" /> : null}
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}
