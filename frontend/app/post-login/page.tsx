"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { resolvePostLoginPath } from "@/lib/post-login";

export default function PostLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;

    async function routeUser() {
      const destination = await resolvePostLoginPath(searchParams.get("next"));
      if (!cancelled) {
        router.replace(destination);
      }
    }

    void routeUser();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f2ea] px-6">
      <div className="rounded-[24px] border border-[#252030] bg-[#0d1018] px-6 py-5 text-sm text-ink-600 shadow-[0_10px_30px_rgba(24,24,24,0.06)]">
        Preparing your workspace...
      </div>
    </main>
  );
}
