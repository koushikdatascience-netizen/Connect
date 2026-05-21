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
    <main className="auth-page flex items-center justify-center px-6 py-10">
      <section className="auth-card max-w-[480px]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Snapkey Connect</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311]">
            Sign in to your workspace
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
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
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#5f533f]">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="auth-input"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="password" className="block text-sm font-medium text-[#5f533f]">
                Password
              </label>
              <Link href="/forgot-password" className="auth-link-pill">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="auth-input"
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

        <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#726451]">
          <span>Need an account?</span>
          <Link href="/register" className="auth-link font-semibold">
            Register for access
          </Link>
        </div>

        {hasDemoToken ? (
          <div className="mt-6 rounded-2xl border border-[#eadba6] bg-[#fff8e2] px-4 py-4 text-xs leading-5 text-[#74664d]">
            <div className="mb-3">Demo access is enabled in this environment.</div>
            <button
              type="button"
              onClick={() => void handleDemoLogin()}
              disabled={submitting}
              className="secondary-button w-full justify-center py-2.5 font-semibold text-[#8b6809]"
            >
              Continue as Demo User
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
