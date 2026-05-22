"use client";

import Link from "next/link";
import { ReactNode } from "react";

type AuthMode = "login" | "register";

type AuthSplitShellProps = {
  mode: AuthMode;
  title: string;
  subtitle: string;
  message?: ReactNode;
  error?: string | null;
  footer?: ReactNode;
  children: ReactNode;
};

const AUTH_IMAGE_URL =
  "https://images.unsplash.com/photo-1778663424846-2150fc61d443?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f172a] text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
          <path d="M7.5 7.5 5 10" />
          <path d="m19 14-2.5 2.5" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold tracking-[-0.04em] text-[#101828]">Snapkey Connect</p>
        <p className="text-xs text-[#667085]">Social media management</p>
      </div>
    </div>
  );
}

function AuthToggle({ mode }: { mode: AuthMode }) {
  const isLogin = mode === "login";

  return (
    <div className="auth-toggle">
      <Link href="/login" className={`auth-toggle-button ${isLogin ? "is-active" : ""}`}>
        Sign In
      </Link>
      <Link href="/register" className={`auth-toggle-button ${!isLogin ? "is-active" : ""}`}>
        Sign Up
      </Link>
    </div>
  );
}

function AuthShowcase() {
  return (
    <div className="auth-showcase">
      <img src={AUTH_IMAGE_URL} alt="Snapkey Connect workspace preview" className="auth-showcase-image" />
    </div>
  );
}

export function AuthSplitShell({
  mode,
  title,
  subtitle,
  message,
  error,
  footer,
  children,
}: AuthSplitShellProps) {
  return (
    <main className="auth-split-page">
      <section className="auth-split-frame">
        <div className="auth-split-form-side">
          <div className="auth-split-form-wrap">
            <BrandMark />

            <div className="mt-10">
              <h1 className="font-display text-[clamp(2rem,4vw,3.1rem)] font-semibold tracking-[-0.07em] text-[#101828]">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#667085]">{subtitle}</p>
            </div>

            <div className="mt-7">
              <AuthToggle mode={mode} />
            </div>

            {message ? <div className="auth-inline-message mt-6 is-success">{message}</div> : null}
            {error ? <div className="auth-inline-message mt-6 is-error">{error}</div> : null}

            <div className="mt-6">{children}</div>

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>

        <div className="auth-split-visual-side">
          <AuthShowcase />
        </div>
      </section>
    </main>
  );
}
