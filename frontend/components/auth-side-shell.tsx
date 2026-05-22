"use client";

import { ReactNode } from "react";

type AuthSideShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const AUTH_SIDE_IMAGE = "https://ik.imagekit.io/elw9ev2tn/stopdoingthingmanually.png";

export function AuthSideShell({ title, description, children }: AuthSideShellProps) {
  return (
    <main className="auth-page flex items-center justify-center px-6 py-10 parent-div">
      <section className="left-main-div">
        <img src={AUTH_SIDE_IMAGE} alt="Secure workspace access" />
      </section>
      <section className="auth-card max-w-[480px]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">Snapkey Connect</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-[#171311]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6d6048]">
            {description}
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}
