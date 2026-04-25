"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { PlatformLogo } from "@/components/platform-logo";
import { beginOAuthLogin, connectWordpressSite, fetchAccounts, fetchAccountStatus } from "@/lib/api";
import { Account, AccountStatusResponse, PlatformName } from "@/lib/types";

const platformMeta: Array<{ key: PlatformName; label: string; hint: string; tone: string }> = [
  { key: "instagram", label: "Instagram", hint: "Schedule posts and stories", tone: "bg-[#2a0f1e] text-[#f472b6]" },
  { key: "twitter", label: "Twitter (X)", hint: "Schedule posts and threads", tone: "bg-[#111] text-white" },
  { key: "linkedin", label: "LinkedIn", hint: "Schedule posts and pages", tone: "bg-[#0c1e30] text-[#60a5fa]" },
  { key: "facebook", label: "Facebook", hint: "Schedule posts and stories", tone: "bg-[#0e1830] text-[#6ea8fe]" },
  { key: "youtube", label: "YouTube", hint: "Schedule video publishing", tone: "bg-[#2a0f0e] text-[#f87171]" },
  { key: "blogger", label: "Blogger", hint: "Schedule blog publishing", tone: "bg-[#2a1508] text-[#fb923c]" },
  { key: "google_business", label: "Google Business", hint: "Schedule business updates", tone: "bg-[#0c1e30] text-[#60a5fa]" },
  { key: "wordpress", label: "WordPress", hint: "Schedule website articles", tone: "bg-[#141924] text-[#9aa4b2]" },
];

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

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="10" rx="3" /><path d="M8 10V8a4 4 0 1 1 8 0v2" /></svg>;
}

export function ConnectionsStudio() {
  const [status, setStatus] = useState<AccountStatusResponse>(emptyStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      setAccounts(accountData.filter((account) => account.is_active));
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load connections.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const connectedCards = useMemo(() => accounts.map((account) => {
    const meta = platformMeta.find((platform) => platform.key === normalizePlatform(account.platform));
    return meta ? { account, meta } : null;
  }).filter(Boolean) as Array<{ account: Account; meta: (typeof platformMeta)[number] }>, [accounts]);

  const recommendedPlatform = useMemo(() => platformMeta.find((platform) => !status[platform.key].connected) ?? platformMeta[0], [status]);

  return (
    <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
      <div className="rounded-[30px] border border-[#1e2535] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,250,240,0.96)_52%,rgba(255,245,221,0.9)_100%)] p-4 shadow-[0_18px_48px_rgba(24,24,24,0.08)] sm:p-5 lg:p-6">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.06em] text-ink-900 sm:text-4xl">Connect Social Accounts</h1>
          <p className="mt-2 text-sm leading-6 text-ink-600">Link your accounts to start scheduling posts. All connection management lives here as a separate workspace.</p>
        </div>

        <ErrorNotice error={error} fallback="We couldn't load social account connections right now." />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-ink-900">Connected Accounts Section</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {connectedCards.length ? connectedCards.map(({ account, meta }) => (
                  <div key={account.id} className="rounded-[24px] border border-[#eadfcd] bg-[#0d1018] p-4 shadow-[0_10px_24px_rgba(24,24,24,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${meta.tone}`}>
                        <PlatformLogo platform={meta.key} className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink-900">{account.account_name}</div>
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#eef8d8] px-2 py-0.5 text-[11px] font-semibold text-[#4a6d16]">Connected <span className="h-1.5 w-1.5 rounded-full bg-[#7bbd5d]" /></div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-ink-500">Last synced: ready to publish</p>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => void handleOAuthConnect(meta.key, true)} className="secondary-button px-4 py-2 text-sm">Manage</button>
                      <button type="button" onClick={() => void load()} className="secondary-button px-4 py-2 text-sm">Refresh</button>
                    </div>
                  </div>
                )) : <div className="rounded-[24px] border border-dashed border-[#e5dbc8] bg-[#0b0d14] px-5 py-10 text-center text-sm text-ink-500 md:col-span-2">No connected accounts yet. Use the add-account cards below to get started.</div>}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-2xl font-semibold text-ink-900">Add New Account Section</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {platformMeta.slice(0, 4).map((platform) => (
                  <button key={platform.key} type="button" onClick={() => void handleOAuthConnect(platform.key, status[platform.key].connected)} className="rounded-[24px] border border-[#eadfcd] bg-[#0d1018] p-5 text-center shadow-[0_10px_24px_rgba(24,24,24,0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(24,24,24,0.08)]">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${platform.tone}`}>
                      <PlatformLogo platform={platform.key} className="h-7 w-7" />
                    </div>
                    <div className="mt-4 text-lg font-semibold text-ink-900">{platform.label}</div>
                    <p className="mt-1 text-sm text-ink-500">{platform.hint}</p>
                    <span className="primary-button mt-5 w-full justify-center py-2.5 text-sm">{status[platform.key].connected ? "Add another" : "Connect"}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[26px] border border-[#eadfcd] bg-[linear-gradient(135deg,#fffef9_0%,#fff8e6_100%)] p-5 shadow-[0_10px_24px_rgba(24,24,24,0.05)]">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] ${recommendedPlatform.tone}`}>
                <PlatformLogo platform={recommendedPlatform.key} className="h-10 w-10" />
              </div>
              <h2 className="mt-4 text-center text-2xl font-semibold text-ink-900">{recommendedPlatform.label}</h2>
              <p className="mt-2 text-center text-sm text-ink-600">{recommendedPlatform.hint}</p>
              <button type="button" onClick={() => void handleOAuthConnect(recommendedPlatform.key, status[recommendedPlatform.key].connected)} className="primary-button mt-5 w-full justify-center py-3 text-base">{status[recommendedPlatform.key].connected ? "Connect another" : "Connect"}</button>
              <p className="mt-4 text-center text-sm leading-6 text-ink-500">We use OAuth secure authentication. No passwords are stored on our servers.</p>
            </section>

            <section className="rounded-[26px] border border-[#eadfcd] bg-[#0d1018] p-5 shadow-[0_10px_24px_rgba(24,24,24,0.05)]">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff0cb] text-ink-900"><LockIcon /></div>
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">Your data is secure and encrypted</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-600">Securely link your accounts with industry-standard protocols. We only request the permissions needed for posting and analytics.</p>
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-[#eadfcd] bg-[#0d1018] p-5 shadow-[0_10px_24px_rgba(24,24,24,0.05)]">
              <div className="mb-3 text-xl font-semibold text-ink-900">Connect flow preview</div>
              <div className="rounded-[24px] border border-[#ede3d4] bg-[#0b0d14] p-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#ff8a4d,#e1306c,#7b42f6)] shadow-[0_14px_28px_rgba(225,48,108,0.22)]">
                  <PlatformLogo platform="instagram" className="h-8 w-8 text-white" />
                </div>
                <div className="mt-4 text-center text-xl font-semibold text-ink-900">Connect Instagram to Scheduler</div>
                <div className="mt-4 rounded-2xl border border-[#e9dfcf] bg-[#0d1018] px-4 py-3 text-center text-sm text-ink-600">Platform login</div>
                <div className="mt-3 rounded-2xl border border-[#e9dfcf] bg-[#0d1018] px-4 py-3 text-sm text-ink-600">
                  Permission required:
                  <div className="mt-2">✓ Create and edit posts</div>
                  <div>✓ View analytics</div>
                </div>
                <button type="button" onClick={() => void handleOAuthConnect("instagram", status.instagram.connected)} className="primary-button mt-4 w-full justify-center py-3">Confirm</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
