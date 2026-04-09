"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { hasStoredAuthToken } from "@/lib/api";

const PUBLIC_PATHS = new Set(["/login", "/privacy-policy", "/terms"]);

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  const isPublicPath = useMemo(() => {
    if (!pathname) {
      return false;
    }
    return PUBLIC_PATHS.has(pathname);
  }, [pathname]);

  useEffect(() => {
    const hasToken = hasStoredAuthToken();

    if (isPublicPath) {
      if (pathname === "/login" && hasToken) {
        const nextPath = searchParams.get("next") || "/";
        router.replace(nextPath);
        return;
      }
      setReady(true);
      return;
    }

    if (!hasToken) {
      const nextPath = pathname || "/";
      router.replace(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    setReady(true);
  }, [isPublicPath, pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f2ea] px-6">
        <div className="rounded-[24px] border border-[#ece2d2] bg-white px-6 py-5 text-sm text-ink-600 shadow-[0_10px_30px_rgba(24,24,24,0.06)]">
          Checking session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
