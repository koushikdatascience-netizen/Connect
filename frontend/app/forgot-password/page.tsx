"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const response = await requestPasswordReset(email);
      setMessage(response.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request a password reset.");
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
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
            Enter your email address and we&apos;ll send a secure password reset link if your account exists.
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
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input"
            placeholder="Email address"
            autoComplete="email"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="primary-button w-full justify-center py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 text-sm text-[#726451]">
          Remembered it?{" "}
          <Link href="/login" className="auth-link font-semibold">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
