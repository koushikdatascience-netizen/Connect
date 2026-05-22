"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthSideShell } from "@/components/auth-side-shell";
import { registerConnectUser } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="auth-input"
          placeholder="Password"
          autoComplete="new-password"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="auth-input"
          placeholder="Confirm password"
          autoComplete="new-password"
          required
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
