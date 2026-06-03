"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthPasswordField } from "@/components/auth-password-field";
import { AuthSideShell } from "@/components/auth-side-shell";
import { GoogleAuthButton } from "@/components/google-auth-button";
import { getGoogleAuthUrl, registerConnectUser } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const googleAuthUrl = getGoogleAuthUrl("/post-login");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const response = await registerConnectUser({
        email,
        phone,
        password,
        confirm_password: confirmPassword,
      });
      setMessage(response.message);
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Unable to complete registration.");
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    if (!googleAuthUrl) {
      setError("Google sign-up is not configured yet. Ask the admin to set NEXT_PUBLIC_GOOGLE_AUTH_URL.");
      return;
    }

    window.location.href = googleAuthUrl;
  }

  return (
    <AuthSideShell
      title="Create account"
      description="Create your Snapkey Connect account. We'll send a verification email first, then your workspace can be approved for beta access."
    >
      {message ? (
        <div className="mb-5 rounded-2xl border border-[#d7e9c0] bg-[#f7fbef] px-4 py-3 text-sm text-[#53722c]">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl border border-[#3a1515] bg-[#2a100e] px-4 py-3 text-sm text-[#f07070]">
          {error}
        </div>
      ) : null}

      <GoogleAuthButton
        label="Sign up with Google"
        onClick={handleGoogleLogin}
        disabled={submitting}
      />

      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b8a6b]">
        <span className="h-px flex-1 bg-[#eadba6]" />
        Or
        <span className="h-px flex-1 bg-[#eadba6]" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="auth-input"
          placeholder="Email address"
          autoComplete="email"
          required
        />
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="auth-input"
          placeholder="Phone number"
          autoComplete="tel"
          required
        />
        <AuthPasswordField
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Password"
          autoComplete="new-password"
        />
        <AuthPasswordField
          id="confirm-password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm password"
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={submitting}
          className="primary-button w-full justify-center py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting..." : "Register"}
        </button>
      </form>

      <div className="mt-5 text-sm text-[#726451]">
        Already registered?{" "}
        <Link href="/login" className="auth-link font-semibold">
          Sign in
        </Link>
      </div>
    </AuthSideShell>
  );
}
