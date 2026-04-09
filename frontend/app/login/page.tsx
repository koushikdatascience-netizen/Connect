"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getDemoBearerToken, setStoredAuthToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);

  async function handleDemoLogin() {
    const token = getDemoBearerToken();
    if (!token) {
      setError("NEXT_PUBLIC_DEBUG_BEARER_TOKEN is not configured in the frontend environment.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setStoredAuthToken(token);
      router.replace(nextPath);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to store the demo token.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff9ea_0%,#f7f2ea_55%,#efe6d7_100%)] px-6 py-10">
      <section className="w-full max-w-[460px] rounded-[30px] border border-[#ece2d2] bg-white/95 p-8 shadow-[0_22px_60px_rgba(24,24,24,0.08)] backdrop-blur">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b38d35]">SnapKey Demo Access</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">
            Sign in for testing
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-600">
            This temporary login stores a demo bearer token locally so dashboard data, scheduled posts, and social OAuth all use one consistent auth context.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#f1d3d0] bg-[#fff4f3] px-4 py-3 text-sm text-[#a54848]">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => void handleDemoLogin()}
          disabled={submitting}
          className="primary-button w-full justify-center py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Signing in..." : "Continue as Demo User"}
        </button>

        <div className="mt-5 rounded-2xl border border-[#ece2d2] bg-[#fcfaf5] px-4 py-3 text-xs leading-5 text-ink-500">
          Expected frontend env:
          <div className="mt-1 font-mono text-[11px] text-ink-700">NEXT_PUBLIC_DEBUG_BEARER_TOKEN=&lt;jwt&gt;</div>
        </div>
      </section>
    </main>
  );
}
