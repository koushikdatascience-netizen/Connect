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
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,213,42,0.11)_0%,transparent_100%),linear-gradient(180deg,#09090e_0%,#07080d_100%)] px-6 py-10">
      <section className="w-full max-w-[460px] rounded-[30px] border border-[#252030] bg-[#0d1018]/95 p-8 shadow-[0_22px_60px_rgba(24,24,24,0.08)] backdrop-blur">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ffd52a]">Snapkey Connect</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-700">
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
            className="w-full rounded-2xl border border-[#252030] bg-[#0d0b14] px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-[#ffd52a]"
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

        <div className="mt-5 text-sm text-ink-600">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-[#ffd52a] hover:text-[#ffe37a]">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
