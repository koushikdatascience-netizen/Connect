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

export function ConnectionsStudioV2() {
  const [status, setStatus] = useState<AccountStatusResponse>(emptyStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

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
  const selectedCard = connectedCards.find(({ account }) => account.id === selectedAccountId) ?? connectedCards[0] ?? null;

  useEffect(() => {
    if (!selectedAccountId && connectedCards[0]) {
      setSelectedAccountId(connectedCards[0].account.id);
    }
  }, [connectedCards, selectedAccountId]);

  return (
    <>
      <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
        <div className="rounded-[30px] border border-[#1c222d] bg-[linear-gradient(180deg,#0c1016_0%,#0b0f15_100%)] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.28)] sm:p-5 lg:p-6">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold tracking-[-0.06em] text-ink-900 sm:text-4xl">Connect Social Accounts</h1>
            <p className="mt-2 text-sm leading-6 text-ink-700">Connected accounts stay in the left panel. When you want to add more, open the connect modal and choose the platform there.</p>
          </div>

          <ErrorNotice error={error} fallback="We couldn't load social account connections right now." />

          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-[#1d2330] bg-[#10151d] p-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">Connected Accounts</h2>
                  <p className="text-sm text-ink-700">{connectedCards.length} ready to publish</p>
                </div>
                <button type="button" onClick={() => setConnectModalOpen(true)} className="primary-button px-4 py-2 text-xs">+ Connect</button>
              </div>

              <div className="space-y-3">
                {connectedCards.length ? connectedCards.map(({ account, meta }) => {
                  const selected = selectedCard?.account.id === account.id;
                  return (
                    <button key={account.id} type="button" onClick={() => setSelectedAccountId(account.id)} className={`w-full rounded-[22px] border p-3 text-left transition ${selected ? "border-brand-300 bg-[#171d28]" : "border-[#202733] bg-[#0d1219] hover:border-[#2b3240]"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${meta.tone}`}>
                          <PlatformLogo platform={meta.key} className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-ink-900">{account.account_name}</div>
                          <div className="truncate text-[11px] text-ink-700">{meta.label}</div>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-[#7bbd5d]" />
                      </div>
                    </button>
                  );
                }) : <div className="rounded-[22px] border border-dashed border-[#29303c] bg-[#0d1219] px-4 py-10 text-center text-sm text-ink-700">No connected accounts yet. Use Connect to start.</div>}
              </div>
            </aside>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="rounded-[28px] border border-[#1d2330] bg-[#10151d] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.22)]">
                {selectedCard ? (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-[24px] ${selectedCard.meta.tone}`}>
                          <PlatformLogo platform={selectedCard.meta.key} className="h-8 w-8" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold text-ink-900">{selectedCard.account.account_name}</h2>
                          <p className="mt-1 text-sm text-ink-700">{selectedCard.meta.label} · {selectedCard.meta.hint}</p>
                          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#172019] px-3 py-1 text-xs font-semibold text-[#91dc72]">Connected <span className="h-1.5 w-1.5 rounded-full bg-[#91dc72]" /></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void handleOAuthConnect(selectedCard.meta.key, true)} className="secondary-button px-4 py-2 text-sm">Add Another</button>
                        <button type="button" onClick={() => void load()} className="secondary-button px-4 py-2 text-sm">Refresh</button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-[22px] border border-[#202733] bg-[#0d1219] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-ink-600">Account Type</div>
                        <div className="mt-2 text-sm font-semibold text-ink-900">{selectedCard.account.account_type?.replace(/_/g, " ") || "Connected account"}</div>
                      </div>
                      <div className="rounded-[22px] border border-[#202733] bg-[#0d1219] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-ink-600">Publishing State</div>
                        <div className="mt-2 text-sm font-semibold text-ink-900">Ready to publish</div>
                      </div>
                      <div className="rounded-[22px] border border-[#202733] bg-[#0d1219] p-4">
                        <div className="text-xs uppercase tracking-[0.14em] text-ink-600">Connection Flow</div>
                        <div className="mt-2 text-sm font-semibold text-ink-900">Use modal to connect more profiles</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[#29303c] bg-[#0d1219] px-5 py-14 text-center text-sm text-ink-700">Connect an account to start publishing, then select it from the left panel.</div>
                )}
              </section>

              <div className="space-y-4">
                <section className="rounded-[26px] border border-[#1d2330] bg-[linear-gradient(135deg,#121924_0%,#171d15_100%)] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                  <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] ${recommendedPlatform.tone}`}>
                    <PlatformLogo platform={recommendedPlatform.key} className="h-10 w-10" />
                  </div>
                  <h2 className="mt-4 text-center text-2xl font-semibold text-ink-900">{recommendedPlatform.label}</h2>
                  <p className="mt-2 text-center text-sm text-ink-700">{recommendedPlatform.hint}</p>
                  <button type="button" onClick={() => setConnectModalOpen(true)} className="primary-button mt-5 w-full justify-center py-3 text-base">Connect Accounts</button>
                  <p className="mt-4 text-center text-sm leading-6 text-ink-700">Open one modal and connect Facebook, Instagram, LinkedIn, X, YouTube, and more from the same place.</p>
                </section>

                <section className="rounded-[26px] border border-[#1d2330] bg-[#10151d] p-5 shadow-[0_10px_24px_rgba(0,0,0,0.22)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#171d28] text-brand-300"><LockIcon /></div>
                    <div>
                      <h3 className="text-xl font-semibold text-ink-900">Your data is secure and encrypted</h3>
                      <p className="mt-2 text-sm leading-6 text-ink-700">Securely link your accounts with industry-standard protocols. We only request the permissions needed for posting and analytics.</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      {connectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(7,10,14,0.76)] p-4 backdrop-blur-sm">
          <div className="w-full max-w-[960px] rounded-[32px] border border-[#1d2330] bg-[#0f141d] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-brand-300">Connect Accounts</div>
                <h2 className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em] text-ink-900">Choose a platform to connect</h2>
                <p className="mt-2 text-sm text-ink-700">All new social account connections start here. Existing accounts stay listed on the left panel.</p>
              </div>
              <button type="button" onClick={() => setConnectModalOpen(false)} className="secondary-button h-11 w-11 rounded-2xl p-0">×</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {platformMeta.map((platform) => (
                <button key={platform.key} type="button" onClick={() => void handleOAuthConnect(platform.key, status[platform.key].connected)} className="rounded-[24px] border border-[#202733] bg-[#111720] p-5 text-center shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-1 hover:border-brand-300">
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${platform.tone}`}>
                    <PlatformLogo platform={platform.key} className="h-7 w-7" />
                  </div>
                  <div className="mt-4 text-lg font-semibold text-ink-900">{platform.label}</div>
                  <p className="mt-1 text-sm text-ink-700">{platform.hint}</p>
                  <span className="primary-button mt-5 w-full justify-center py-2.5 text-sm">{status[platform.key].connected ? "Add another" : "Connect"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
