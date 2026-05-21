"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { resetConnectPassword } from "@/lib/api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("This password reset link is missing its token.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const response = await resetConnectPassword({
        token,
        password,
        confirm_password: confirmPassword,
      });
      setMessage(response.message);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Unable to reset your password.");
      setMessage(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page flex items-center justify-center px-6 py-10">
      <section className="auth-card max-w-[460px]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Snapkey Connect</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311]">
            Choose a new password
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
            Set a new password for your Snapkey Connect account using the secure link from your email.
          </p>
        </div>

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
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="auth-input"
            placeholder="New password"
            autoComplete="new-password"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="auth-input"
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
          />
          <button
            type="submit"
            disabled={submitting || !token}
            className="primary-button w-full justify-center py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[#726451]">
          Back to{" "}
          <Link href="/login" className="auth-link font-semibold">
            sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
