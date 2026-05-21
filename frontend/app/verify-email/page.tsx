"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { verifyConnectEmail } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!token) {
        setError("This verification link is missing its token.");
        setLoading(false);
        return;
      }
      try {
        const response = await verifyConnectEmail(token);
        if (!cancelled) {
          setMessage(response.message);
          setError(null);
        }
      } catch (verificationError) {
        if (!cancelled) {
          setError(verificationError instanceof Error ? verificationError.message : "Unable to verify your email.");
          setMessage(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main className="auth-page flex items-center justify-center px-6 py-10">
      <section className="auth-card max-w-[460px]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Snapkey Connect</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311]">
            Verify your email
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
            We&apos;re confirming your email address so your Snapkey Connect access can move forward safely.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#eadba6] bg-[#fff8e2] px-4 py-3 text-sm text-[#726451]">
            Verifying your email...
          </div>
        ) : null}

        {!loading && message ? (
          <div className="rounded-2xl border border-[#d7e9c0] bg-[#f7fbef] px-4 py-3 text-sm text-[#53722c]">
            {message}
          </div>
        ) : null}

        {!loading && error ? (
          <div className="rounded-2xl border border-[#3a1515] bg-[#2a100e] px-4 py-3 text-sm text-[#f07070]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-[#726451]">
          Continue to{" "}
          <Link href="/login" className="auth-link font-semibold">
            sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
