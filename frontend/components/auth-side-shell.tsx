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
    <main className="flex min-h-screen">

      {/* IMAGE */}
      <section className="hidden md:flex w-1/2 items-center justify-center bg-[#f8f4ef]">
        <img
          src={AUTH_SIDE_IMAGE}
          alt="Secure workspace access"
          className="object-contain max-h-[80%] w-full"
        />
      </section>

      {/* FORM */}
      <section className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="auth-card w-full max-w-[480px]">

          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a67d10]">
              Snapkey Connect
            </p>

            <h1 className="mt-3 font-display text-3xl md:text-4xl font-semibold tracking-[-0.06em] text-[#171311]">
              {title}
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#6d6048]">
              {description}
            </p>
          </div>

          {children}

        </div>
      </section>

    </main>
  );
}