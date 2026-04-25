"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { beginOAuthLogin, connectWordpressSite, fetchAccounts, fetchAccountStatus } from "@/lib/api";
import { Account, AccountStatusResponse, PlatformName } from "@/lib/types";

const platformMeta: Array<{ key: PlatformName; label: string; hint: string; tone: string; border: string }> = [
  { key: "facebook", label: "Facebook", hint: "Pages and Groups", tone: "bg-[#0e1830] text-[#6ea8fe]", border: "#1877f2" },
  { key: "instagram", label: "Instagram", hint: "Business and Creator", tone: "bg-[#2a0f1e] text-[#f472b6]", border: "#e1306c" },
  { key: "linkedin", label: "LinkedIn", hint: "Profiles and Pages", tone: "bg-[#0c1e30] text-[#60a5fa]", border: "#0a66c2" },
  { key: "twitter", label: "X (Twitter)", hint: "Text-first publishing", tone: "bg-[#0d0d0d] text-white", border: "#111111" },
  { key: "youtube", label: "YouTube", hint: "Video publishing", tone: "bg-[#2a0f0e] text-[#f87171]", border: "#ff0000" },
  { key: "blogger", label: "Blogger", hint: "Blog publishing", tone: "bg-[#2a1508] text-[#fb923c]", border: "#ef6c00" },
  { key: "google_business", label: "Google Business", hint: "Business updates", tone: "bg-[#0c1e30] text-[#60a5fa]", border: "#1a73e8" },
  { key: "wordpress", label: "WordPress", hint: "Website blog", tone: "bg-[#141924] text-[#9aa4b2]", border: "#334e68" },
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

function PlatformMonogram({ label }: { label: string }) {
  const initials = label.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className="text-sm font-semibold">{initials}</span>;
}

export default function ConnectionsClient() {
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
      setAccounts(accountData);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load connections.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const activeAccounts = accounts.filter((account) => account.is_active);
  const accountsByPlatform = useMemo(() => platformMeta.reduce<Record<PlatformName, Account[]>>((acc, platform) => {
    acc[platform.key] = activeAccounts.filter((account) => normalizePlatform(account.platform) === platform.key);
    return acc;
  }, {} as Record<PlatformName, Account[]>), [activeAccounts]);

  return (
    <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
      <div className="rounded-[30px] border border-[#1e2535] bg-[linear-gradient(135deg,rgba(255,255,255,0.92)_0%,rgba(255,250,240,0.96)_52%,rgba(255,245,221,0.9)_100%)] p-4 shadow-[0_18px_48px_rgba(24,24,24,0.08)] sm:p-5 lg:p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffd52a]">Social Connections</p>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.06em] text-ink-900 sm:text-4xl">Manage your connected channels</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">All account setup lives here now, separate from the main dashboard, so the product feels cleaner and easier to scan.</p>
          </div>
          <div className="rounded-full bg-[#0d1018]/85 px-4 py-2 text-sm font-semibold text-ink-900 shadow-[0_8px_18px_rgba(24,24,24,0.06)]">{activeAccounts.length} active accounts</div>
        </div>

        <ErrorNotice error={error} fallback="We couldn't load social account connections right now." />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {platformMeta.map((platform) => {
            const connected = status[platform.key].connected;
            const platformAccounts = accountsByPlatform[platform.key] ?? [];
            return (
              <button
                key={platform.key}
                type="button"
                onClick={() => void handleOAuthConnect(platform.key, platformAccounts.length > 0)}
                className={`platform-card rounded-[24px] border p-5 text-left ${connected ? "bg-[#0d1018] shadow-[0_12px_28px_rgba(24,24,24,0.05)]" : "bg-[#fbf8f1] border-dashed"}`}
                style={connected ? { borderLeftWidth: "3px", borderLeftColor: platform.border } : undefined}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${platform.tone} ${connected ? "" : "opacity-55"}`}>
                    <PlatformMonogram label={platform.label} />
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${connected ? "bg-[#eef8d8] text-[#527227]" : "bg-[#f1ebe0] text-[#8b7d68]"}`}>
                    <span className={`rounded-full ${connected ? "h-2.5 w-2.5 bg-[#8dc63f]" : "h-2 w-2 bg-[#c7bca9]"}`} />
                    {connected ? "Live" : "Not connected"}
                  </span>
                </div>

                <div className="mt-4">
                  <h2 className="text-xl font-semibold text-ink-900">{platform.label}</h2>
                  <p className="mt-1 text-sm text-ink-500">{platformAccounts.length ? platformAccounts.map((account) => account.account_name).slice(0, 2).join(", ") : platform.hint}</p>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#efe4d3] pt-3">
                  <span className="text-sm text-ink-500">{platformAccounts.length} account{platformAccounts.length === 1 ? "" : "s"}</span>
                  <span className={`rounded-full px-3 py-1.5 text-xs ${connected ? "bg-brand-300 font-semibold text-ink-900" : "border border-dashed border-[#e6dcc8] bg-transparent text-ink-500"}`}>
                    {connected ? "Manage" : "+ Connect"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
