"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthSplitShell } from "@/components/auth-split-shell";
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
    <AuthSplitShell
      title="Welcome back"
      subtitle="Use your Snapkey Connect credentials to manage publishing access, connected accounts, and scheduled content."
      message={approvalNotice ?? undefined}
      error={error}
      footer={
        hasDemoToken ? (
          <div className="rounded-[24px] border border-[#d9e4ff] bg-[#f5f8ff] p-4 text-sm text-[#475467]">
            <p className="text-xs text-[#74664d]">Demo access is enabled in this environment.</p>
            <button
              type="button"
              onClick={() => void handleDemoLogin()}
              disabled={submitting}
              className="secondary-button mt-3 w-full justify-center py-2.5 font-semibold text-[#8b6809]"
            >
              Continue as Demo User
            </button>
          </div>
        ) : undefined
      }
    >
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#344054]">
            Email address
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
            <label htmlFor="password" className="block text-sm font-medium text-[#344054]">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-[#2463eb] transition-colors hover:text-[#1849a9]">
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
        <button type="submit" disabled={submitting} className="auth-submit-button">
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-sm text-[#726451]">
        <span>Need an account?</span>
        <Link href="/register" className="auth-link font-semibold">
          Register for access
        </Link>
      </div>
    </AuthSplitShell>
  );
}
