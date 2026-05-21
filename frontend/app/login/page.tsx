"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getDemoBearerToken, loginConnectUser, setStoredAuthToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nextPath = useMemo(() => searchParams.get("next") || "/", [searchParams]);
  const approvalNotice = useMemo(() => searchParams.get("approval"), [searchParams]);
  const hasDemoToken = Boolean(getDemoBearerToken());

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const session = await loginConnectUser({
        email,
        password,
      });
      setStoredAuthToken(session.token);
      router.replace(nextPath);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,213,42,0.11)_0%,transparent_100%),linear-gradient(180deg,#09090e_0%,#07080d_100%)] px-6 py-10">
      <section className="w-full max-w-[460px] rounded-[30px] border border-[#252030] bg-[#0d1018]/95 p-8 shadow-[0_22px_60px_rgba(24,24,24,0.08)] backdrop-blur">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ffd52a]">Snapkey Connect</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">
            Sign in to your workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-700">
            Use your Snapkey Connect credentials to manage publishing access, connected accounts, and scheduled content.
          </p>
        </div>

        {approvalNotice ? (
          <div className="mb-5 rounded-2xl border border-[#d7e9c0] bg-[#f7fbef] px-4 py-3 text-sm text-[#53722c]">
            {approvalNotice}
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-[#3a1515] bg-[#2a100e] px-4 py-3 text-sm text-[#f07070]">
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-[#252030] bg-[#0d0b14] px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-[#ffd52a]"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="block text-sm font-medium text-ink-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-[#ffd52a] hover:text-[#ffe37a]">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-[#252030] bg-[#0d0b14] px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-[#ffd52a]"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="primary-button w-full justify-center py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-ink-600">
          <span>Need an account?</span>
          <Link href="/register" className="font-medium text-[#ffd52a] hover:text-[#ffe37a]">
            Register for access
          </Link>
        </div>

        {hasDemoToken ? (
          <div className="mt-6 rounded-2xl border border-[#252030] bg-[#0d0b14] px-4 py-4 text-xs leading-5 text-ink-500">
            <div className="mb-3">Demo access is enabled in this environment.</div>
            <button
              type="button"
              onClick={() => void handleDemoLogin()}
              disabled={submitting}
              className="w-full rounded-full border border-[#3b3421] px-4 py-2.5 text-sm font-semibold text-[#ffd52a] transition hover:border-[#5a4b1e] hover:bg-[#151515] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue as Demo User
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
