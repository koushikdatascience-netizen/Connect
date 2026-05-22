"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

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
    <main className="auth-page flex items-center justify-center px-6 py-10">
      <section className="auth-card max-w-[520px]">
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-medium text-[#8f7440]">
            <a href="https://crm.snapkey.in" className="inline-flex items-center gap-1 rounded-full border border-[#ead9af] bg-white/80 px-3 py-1.5 transition-colors hover:bg-[#fff7df]">
              <span aria-hidden="true">←</span>
              Back to Snapkey CRM
            </a>
            <a href="https://snapkey.in" className="transition-colors hover:text-[#684d10]">snapkey.in</a>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Snapkey Connect - Part of Snapkey CRM</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311]">
            Request access
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
            Snapkey Connect is a social media management module within Snapkey CRM. It allows businesses to connect their social media accounts, create content, schedule posts, and manage publishing using authorized platform integrations.
          </p>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
            Access your Snapkey workspace to manage connected accounts and social media publishing.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#7d6b4c]">
            This platform is part of Snapkey CRM and is accessible to authorized users. Some features may require an active Snapkey CRM account.
          </p>
          <p className="mt-2 text-sm leading-6 text-[#6d6048]">
            Create your Snapkey Connect account. We&apos;ll send a verification email first, then your workspace can be approved for beta access.
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
      </section>
    </main>
  );
}
