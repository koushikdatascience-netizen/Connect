"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthSplitShell } from "@/components/auth-split-shell";
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
    <AuthSplitShell
      mode="register"
      title="Create account"
      subtitle="Set up your workspace access in a few quick steps."
      message={message ?? undefined}
      error={error}
      footer={
        <p className="text-sm text-[#667085]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#2463eb] transition-colors hover:text-[#1849a9]">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#344054]">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="auth-input"
            placeholder="Email address"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#344054]">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="auth-input"
            placeholder="Phone number"
            autoComplete="tel"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#344054]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="auth-input"
            placeholder="Create password"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[#344054]">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="auth-input"
            placeholder="Confirm password"
            autoComplete="new-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="auth-submit-button"
        >
          {submitting ? "Submitting..." : "Continue"}
        </button>
      </form>
    </AuthSplitShell>
  );
}
