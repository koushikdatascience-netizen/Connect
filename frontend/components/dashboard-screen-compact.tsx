"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { PostComposerModal } from "@/components/post-composer-modal-v2";
import { PlatformLogo, platformMeta } from "@/components/dashboard-helpers";
import { beginOAuthLogin, connectWordpressSite, fetchAccounts, fetchAccountStatus } from "@/lib/api";
import { Account, AccountStatusResponse, PlatformName } from "@/lib/types";

const emptyStatus: AccountStatusResponse = {
  facebook: { connected: false, active_accounts: 0 },
  instagram: { connected: false, active_accounts: 0 },
  linkedin: { connected: false, active_accounts: 0 },
  twitter: { connected: false, active_accounts: 0 },
  youtube: { connected: false, active_accounts: 0 },
  blogger: { connected: false, active_accounts: 0 },
  google_business: { connected: false, active_accounts: 0 },
  wordpress: { connected: false, active_accounts: 0 },
};

function normalizePlatform(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function DashboardScreenCompact() {
  const [status, setStatus] = useState<AccountStatusResponse>(emptyStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [oauthBanner, setOauthBanner] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function handleOAuthConnect(platform: PlatformName, addAnother = false) {
    try {
      setError(null);
      if (platform === "wordpress") {
        const site_url = window.prompt("WordPress site URL");
        if (!site_url) return;
        const username = window.prompt("WordPress username");
        if (!username) return;
        const application_password = window.prompt("WordPress application password");
        if (!application_password) return;
        await connectWordpressSite({ site_url, username, application_password });
        await load();
        return;
      }
      await beginOAuthLogin(platform, { addAnother });
    } catch (oauthError) {
      setError(oauthError instanceof Error ? oauthError.message : "Unable to start social login.");
    }
  }

  async function load() {
    try {
      const [statusData, accountData] = await Promise.all([fetchAccountStatus(), fetchAccounts()]);
      setStatus(statusData);
      setAccounts(accountData);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const oauthResult = url.searchParams.get("oauth_result");
    const oauthPlatform = url.searchParams.get("oauth_platform");
    const oauthMessage = url.searchParams.get("oauth_message");
    const oauthCount = url.searchParams.get("oauth_count");
    if (!oauthResult || !oauthMessage) return;

    const platformLabel = oauthPlatform ? `${oauthPlatform[0].toUpperCase()}${oauthPlatform.slice(1)}` : "Social";
    setOauthBanner({
      tone: oauthResult === "success" ? "success" : "error",
      text:
        oauthResult === "success"
          ? `${platformLabel}: ${oauthMessage}${oauthCount ? ` Added account count: ${oauthCount}.` : ""}`
          : `${platformLabel}: ${oauthMessage}`,
    });

    url.searchParams.delete("oauth_result");
    url.searchParams.delete("oauth_platform");
    url.searchParams.delete("oauth_message");
    url.searchParams.delete("oauth_count");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }, []);

  const stats = useMemo(() => {
    const connectedPlatforms = Object.values(status).filter((item) => item.connected).length;
    const totalAccounts = accounts.filter((item) => item.is_active).length;
    return { connectedPlatforms, totalAccounts };
  }, [accounts, status]);

  const accountsByPlatform = useMemo(
    () =>
      platformMeta.reduce<Record<PlatformName, Account[]>>((acc, platform) => {
        acc[platform.key] = accounts.filter((account) => account.is_active && normalizePlatform(account.platform) === platform.key);
        return acc;
      }, {} as Record<PlatformName, Account[]>),
    [accounts],
  );

  return (
    <>
      <main className="flex min-h-[calc(100vh-2.5rem)] flex-col">
        <div className="flex-1 space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <section className="fade-up rounded-[26px] border border-[#efe7d8] bg-[linear-gradient(135deg,#fffef9_0%,#fffaf0_58%,#fff4d8_100%)] p-5 shadow-[0_10px_28px_rgba(24,24,24,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffd52a]">Social Publishing Dashboard</p>
                <h1 className="font-display text-[1.9rem] font-semibold tracking-[-0.06em] text-ink-900 sm:text-[2.15rem]">Connect accounts and post fast</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
                  A compact workspace for connecting channels, creating a post, and opening scheduled posts.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setComposerOpen(true)} className="primary-button px-6 py-3 text-sm font-semibold">
                  New Post
                </button>
                <a href="/posts" className="secondary-button px-6 py-3 text-sm font-semibold">
                  Scheduled Posts
                </a>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-[#0d1018]/85 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                {stats.connectedPlatforms} live platform{stats.connectedPlatforms !== 1 ? "s" : ""}
              </span>
              <span className="inline-flex rounded-full bg-[#0d1018]/85 px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                {stats.totalAccounts} active account{stats.totalAccounts !== 1 ? "s" : ""}
              </span>
            </div>

            {error ? (
              <div className="mt-4">
                <ErrorNotice error={error} fallback="We couldn't load the dashboard right now." />
              </div>
            ) : null}

            {oauthBanner ? (
              <div
                className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                  oauthBanner.tone === "success"
                    ? "border-[#d7e9c0] bg-[#f7fbef] text-[#53722c]"
                    : "border-[#3a1515] bg-[#2a100e] text-[#f07070]"
                }`}
              >
                {oauthBanner.text}
              </div>
            ) : null}
          </section>

          <section className="fade-up fade-up-2 panel p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-[1.55rem] font-semibold tracking-[-0.05em] text-ink-900">Channels</h2>
                <p className="mt-1 text-sm text-ink-600">Small responsive cards for account connections.</p>
              </div>
              <span className="inline-flex self-start rounded-full bg-[#141924] px-3 py-1 text-xs font-semibold text-[#ab8b3b] sm:self-auto">
                {stats.connectedPlatforms} connected
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {platformMeta.map((platform, index) => {
                const platformAccounts = accountsByPlatform[platform.key] ?? [];
                const connected = status[platform.key].connected;

                return (
                  <button
                    key={platform.key}
                    type="button"
                    onClick={() => void handleOAuthConnect(platform.key, platformAccounts.length > 0)}
                    style={{ animationDelay: `${0.04 + index * 0.04}s` }}
                    className={`platform-card fade-up group rounded-[20px] border p-4 text-left ${
                      connected
                        ? `border-[#eadfcd] bg-gradient-to-br shadow-[0_8px_20px_rgba(24,24,24,0.04)] ${platform.gradient}`
                        : "border-dashed border-[#e6dcc8] bg-[#fbf8f1]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${platform.tone}`}>
                        <PlatformLogo platform={platform.key} className="h-5 w-5" />
                      </div>
                      <div
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          connected ? "bg-[#eef8d8] text-[#527227]" : "bg-[#f1ebe0] text-[#8b7d68]"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${connected ? "bg-[#8dc63f]" : "bg-[#c7bca9]"}`} />
                        <span>{connected ? "Live" : "Disconnected"}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h3 className="text-lg font-semibold text-ink-900">{platform.label}</h3>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {platformAccounts.length
                          ? platformAccounts.slice(0, 2).map((account) => account.account_name).join(", ")
                          : platform.hint}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#efe4d3] pt-3">
                      <span className="text-xs font-medium text-ink-500">
                        {platformAccounts.length} account{platformAccounts.length === 1 ? "" : "s"}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          connected ? "border border-[#f3d97c] bg-[#ffe274] text-ink-900" : "border border-[#e4dac8] bg-[#0d1018] text-ink-700"
                        }`}
                      >
                        {connected && platformAccounts.length ? "Manage" : "+ Connect"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <PostComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} onCreated={load} />
    </>
  );
}
