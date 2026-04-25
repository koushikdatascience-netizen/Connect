"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { exchangeWebviewCode, fetchSession } from "@/lib/api";

type WebViewPhase = "verifying" | "redirecting" | "failed";

export default function WebViewAuthPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<WebViewPhase>("verifying");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const code = params.get("code") || "";
      const nextPath = params.get("next") || "/";

      if (!code) {
        setPhase("failed");
        setError("WebView authorization code is missing.");
        return;
      }

      const sessionKey = `snapkey_webview_code_${code}`;
      if (typeof window !== "undefined" && window.sessionStorage.getItem(sessionKey) === "started") {
        return;
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(sessionKey, "started");
      }

      try {
        setPhase("verifying");
        await exchangeWebviewCode(code);
        const session = await fetchSession();
        if (!session.authenticated) {
          throw new Error("Session was created, but confirmation failed. Please reopen the app link.");
        }
        if (cancelled) {
          return;
        }
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(sessionKey);
        }
        setPhase("redirecting");
        window.history.replaceState({}, "", nextPath);
        router.replace(nextPath);
      } catch (exchangeError) {
        if (cancelled) {
          return;
        }
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(sessionKey);
        }
        setPhase("failed");
        setError(
          exchangeError instanceof Error
            ? exchangeError.message
            : "Unable to complete WebView sign-in.",
        );
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff9ea_0%,#f7f2ea_55%,#efe6d7_100%)] px-6 py-10">
      <section className="w-full max-w-[460px] rounded-[30px] border border-[#252030] bg-[#0d1018]/95 p-8 shadow-[0_22px_60px_rgba(24,24,24,0.08)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#ffd52a]">SnapKey WebView Access</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">
          {phase === "redirecting" ? "Redirecting you now" : "Signing you in"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          {phase === "redirecting"
            ? "Your session is ready. Taking you back into SnapKey now."
            : "Completing secure WebView authorization for the embedded app experience."}
        </p>
        {error ? (
          <div className="mt-5 rounded-2xl border border-[#3a1515] bg-[#2a100e] px-4 py-3 text-sm text-[#f07070]">
            {error}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#252030] bg-[#0d0b14] px-4 py-4 text-sm text-ink-600">
            {phase === "redirecting"
              ? "Session confirmed. Redirecting to your workspace..."
              : "Verifying authorization code and establishing session..."}
          </div>
        )}
        {error ? (
          <p className="mt-4 text-xs leading-5 text-ink-500">
            If this link was reused or opened too late, generate a fresh WebView sign-in link from the host app and try again.
          </p>
        ) : null}
      </section>
    </main>
  );
}
