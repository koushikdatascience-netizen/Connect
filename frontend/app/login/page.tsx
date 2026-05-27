"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthPasswordField } from "@/components/auth-password-field";
import { AuthSideShell } from "@/components/auth-side-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { getDemoBearerToken, getGoogleAuthUrl, loginConnectUser, setStoredAuthToken } from "@/lib/api";

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
  const googleAuthUrl = useMemo(() => getGoogleAuthUrl(nextPath), [nextPath]);

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

  function handleGoogleLogin() {
    if (!googleAuthUrl) {
      setError("Google sign-in is not configured yet. Ask the admin to set NEXT_PUBLIC_GOOGLE_AUTH_URL.");
      return;
    }

    window.location.href = googleAuthUrl;
  }

  return (
    <AuthSideShell
      title="Welcome back"
      description="Use your Snapkey Connect credentials to manage publishing access, connected accounts, and scheduled content."
    >
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

      <GoogleAuthButton
        label="Continue with Google"
        onClick={handleGoogleLogin}
        disabled={submitting}
      />

      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8a6b]">
        <span className="h-px flex-1 bg-[#eadba6]" />
        Or
        <span className="h-px flex-1 bg-[#eadba6]" />
      </div>

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
          <AuthPasswordField
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
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
      <span></span>
      <Link href="/register" className="auth-link font-semibold">
        <span style={{ fontWeight: "normal", color: "black" }}>
          Need an Account?
        </span>{" "}
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
    </AuthSideShell>
  );
}
