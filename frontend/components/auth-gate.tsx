"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { fetchSession, hasStoredAuthToken } from "@/lib/api";
import { SessionState, SessionStateContext } from "@/components/session-state";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy-policy",
  "/terms",
  "/webview-auth",
]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);

  const isPublicPath = useMemo(() => {
    if (!pathname) {
      return false;
    }
    return PUBLIC_PATHS.has(pathname);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function resolveSession() {
      const hasToken = hasStoredAuthToken();
      let hasCookieSession = false;
      let resolvedSession: SessionState | null = null;

      try {
        resolvedSession = await fetchSession();
        hasCookieSession = Boolean(resolvedSession?.authenticated);
      } catch {
        hasCookieSession = false;
      }

      const isAuthenticated = hasToken || hasCookieSession;

      if (cancelled) {
        return;
      }

      setSession(resolvedSession);

      if (isPublicPath) {
        if ((pathname === "/login" || pathname === "/webview-auth") && isAuthenticated) {
          const nextPath =
            typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("next") || "/"
              : "/";
          router.replace(nextPath);
          return;
        }
        setReady(true);
        return;
      }

      if (!isAuthenticated) {
        const nextPath = pathname || "/";
        router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setReady(true);
    }

    void resolveSession();

    return () => {
      cancelled = true;
    };
  }, [isPublicPath, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f2ea] px-6">
        <div className="rounded-[24px] border border-[#252030] bg-[#0d1018] px-6 py-5 text-sm text-ink-600 shadow-[0_10px_30px_rgba(24,24,24,0.06)]">
          Checking session...
        </div>
      </div>
    );
  }

  return (
    <SessionStateContext.Provider
      value={{
        ready,
        session,
        isPendingApproval: session?.status === "pending_review",
      }}
    >
      {children}
    </SessionStateContext.Provider>
  );
}
