"use client";

import { ReactNode } from "react";

type AuthSplitShellProps = {
  title: string;
  subtitle: string;
  message?: ReactNode;
  error?: string | null;
  footer?: ReactNode;
  children: ReactNode;
};

const AUTH_IMAGE_URL =
  "https://images.unsplash.com/photo-1778663424846-2150fc61d443?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

function AuthShowcase() {
  return (
    <div className="auth-showcase">
      <img src={AUTH_IMAGE_URL} alt="Snapkey Connect workspace preview" className="auth-showcase-image" />
    </div>
  );
}

export function AuthSplitShell({
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
        <div className="auth-split-visual-side">
          <AuthShowcase />
        </div>

        <div className="auth-split-form-side">
          <div className="auth-split-form-wrap">
            <div>
              <p className="auth-brand-label">Snapkey Connect</p>
              <h1 className="mt-3 font-display text-[30px] font-semibold text-[#171311]">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#2e251a]">{subtitle}</p>
            </div>

            {message ? <div className="auth-inline-message mt-6 is-success">{message}</div> : null}
            {error ? <div className="auth-inline-message mt-6 is-error">{error}</div> : null}

            <div className="mt-6">{children}</div>

            {footer ? <div className="mt-6">{footer}</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
