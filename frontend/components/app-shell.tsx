"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { PostComposerModal } from "@/components/post-composer-modal-v2";
import { clearStoredAuthToken, logoutSession } from "@/lib/api";

const navigation = [
  { href: "/", label: "Dashboard", icon: "⊞" },
  { href: "/posts", label: "Scheduled Posts", icon: "📅" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#ffd52a] shadow-[0_6px_18px_rgba(255,213,42,0.35)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#09090e]" aria-hidden="true">
        <path d="M12 2a10 10 0 1 0 6.32 17.75l2.67 1.33a1 1 0 0 0 1.45-1.1l-.9-3.58A9.98 9.98 0 0 0 12 2Zm0 4.25a5.75 5.75 0 1 1 0 11.5 5.75 5.75 0 0 1 0-11.5Z" />
      </svg>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    clearStoredAuthToken();
    try { await logoutSession(); } catch { /* ignore */ }
    router.replace("/login");
  }

  function navigateAndClose(href: string) {
    setMobileMenuOpen(false);
    router.push(href);
  }

  if (pathname === "/login" || pathname === "/webview-auth") {
    return <>{children}</>;
  }

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-[#1a2030] bg-[#09090e]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="secondary-button h-11 w-11 rounded-2xl p-0 text-lg"
            aria-label="Open navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="9"   x2="16" y2="9"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="hidden sm:block">
              <div className="font-display text-xl font-semibold tracking-[-0.06em] text-ink-900 leading-tight">Snapkey.</div>
              <p className="text-[11px] text-ink-600">Social Publishing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="primary-button h-11 px-4 py-0 text-xs"
          >
            New Post
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="h-full w-[84%] max-w-[320px] border-r border-[#1e2535] bg-[#0b0d14] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <LogoMark />
                <div>
                  <div className="font-display text-2xl font-semibold tracking-[-0.06em] text-ink-900 leading-tight">Snapkey.</div>
                  <p className="text-xs text-ink-600">Workspace menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="secondary-button h-10 w-10 rounded-2xl p-0"
                aria-label="Close navigation menu"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); setComposerOpen(true); }}
              className="primary-button mb-5 w-full justify-center"
            >
              Create Post
            </button>

            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigateAndClose(item.href)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all ${
                      active
                        ? "bg-[rgba(255,213,42,0.12)] text-[#ffd52a] font-semibold"
                        : "text-ink-600 hover:bg-[#141924] hover:text-ink-900"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-[#ffd52a]" />}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 rounded-[18px] border border-[#252030] bg-[#100e1a] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ffd52a] mb-2">Quick tip</div>
              <p className="text-xs leading-5 text-ink-600">Use platform settings inside the composer to tailor schedule, visibility, and publishing options.</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="secondary-button mt-5 w-full justify-center py-3 text-sm"
            >
              Sign Out
            </button>
          </aside>
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────── */}
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-5 px-4 pb-24 pt-5 lg:px-6 lg:pb-5">

        {/* Sidebar */}
        <aside className="app-surface sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[240px] shrink-0 flex-col justify-between p-5 lg:flex">
          <div className="space-y-7">
            {/* Brand */}
            <div className="flex items-center gap-3 px-1">
              <LogoMark />
              <div>
                <div className="font-display text-[26px] font-semibold tracking-[-0.06em] text-ink-900 leading-tight">
                  Snapkey.
                </div>
                <p className="text-[11px] text-ink-600">Social Publishing</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1">
              {/* Create Post */}
              <button
                type="button"
                onClick={() => setComposerOpen(true)}
                className="group mb-3 flex w-full items-center gap-3 rounded-2xl bg-[#ffd52a] px-4 py-3 text-sm font-semibold text-[#09090e] shadow-[0_6px_18px_rgba(255,213,42,0.28)] transition-all duration-200 hover:bg-[#ffe566] hover:shadow-[0_12px_28px_rgba(255,213,42,0.36)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-lg group-hover:rotate-90 transition-transform duration-300">+</span>
                <span className="flex-1 text-left">Create Post</span>
              </button>

              {navigation.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-[rgba(255,213,42,0.12)] text-[#ffd52a] font-semibold"
                        : "text-ink-600 hover:bg-[#141924] hover:text-ink-900 hover:translate-x-0.5"
                    }`}
                  >
                    <span className={`text-base transition-transform duration-150 ${active ? "scale-110" : "group-hover:scale-110"}`}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-[#ffd52a]" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar bottom */}
          <div className="space-y-3">
            <div className="rounded-[18px] border border-[#252030] bg-[#0d0b14] p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffd52a]" />
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ffd52a]">Pro Features</div>
              </div>
              <p className="text-xs leading-5 text-ink-600">Analytics, team collaboration, and priority scheduling.</p>
              <button type="button" className="primary-button mt-3 w-full py-2.5 text-xs">
                Upgrade to Pro
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="secondary-button w-full justify-center py-2.5 text-xs"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="app-surface min-h-[calc(100vh-2.5rem)] overflow-hidden">
            {children}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="fixed inset-x-4 bottom-4 z-40 rounded-[24px] border border-[#1e2535] bg-[#0b0d14]/95 p-2 shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-1">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center rounded-[18px] px-2 py-2.5 text-[10px] font-medium transition-all ${
                  active
                    ? "bg-[#ffd52a] text-[#09090e]"
                    : "text-ink-600 hover:bg-[#141924] hover:text-ink-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="mt-1">{item.label.replace("Scheduled ", "")}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <PostComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
    </>
  );
}
