"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { PlatformLogo } from "@/components/platform-logo";
import { beginOAuthLogin, connectWordpressSite, fetchAccounts, fetchAccountStatus } from "@/lib/api";
import { Account, AccountStatusResponse, PlatformName } from "@/lib/types";

const platformMeta: Array<{
  key: PlatformName;
  label: string;
  hint: string;
  color: string;
  bg: string;
  textColor: string;
}> = [
  { key: "facebook", label: "Facebook", hint: "Pages and Groups", color: "#1877f2", bg: "rgba(24,119,242,0.10)", textColor: "#1877f2" },
  { key: "instagram", label: "Instagram", hint: "Business and Creator accounts", color: "#e1306c", bg: "rgba(225,48,108,0.10)", textColor: "#e1306c" },
  { key: "linkedin", label: "LinkedIn", hint: "Profiles and Company Pages", color: "#0a66c2", bg: "rgba(10,102,194,0.10)", textColor: "#0a66c2" },
  { key: "twitter", label: "X (Twitter)", hint: "Text-first publishing", color: "#111111", bg: "rgba(17,17,17,0.08)", textColor: "#111111" },
  { key: "youtube", label: "YouTube", hint: "Video publishing channels", color: "#ff0000", bg: "rgba(255,0,0,0.08)", textColor: "#cc0000" },
  { key: "blogger", label: "Blogger", hint: "Blog publishing", color: "#ef6c00", bg: "rgba(239,108,0,0.10)", textColor: "#c85a00" },
  { key: "google_business", label: "Google Business", hint: "Business profile updates", color: "#1a73e8", bg: "rgba(26,115,232,0.10)", textColor: "#1a73e8" },
  { key: "wordpress", label: "WordPress", hint: "Website and blog posts", color: "#21759b", bg: "rgba(33,117,155,0.10)", textColor: "#21759b" },
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className="h-4 w-4 transition-transform duration-300"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 4.5h11M6 4.5V3h4v1.5M5 4.5l.5 8h5l.5-8" />
    </svg>
  );
}

function AccountRow({
  account,
  onRemove,
  platform,
}: {
  account: Account;
  onRemove: (id: number) => void;
  platform: (typeof platformMeta)[0];
}) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove "${account.account_name}"?`)) return;
    setRemoving(true);
    try {
      onRemove(account.id);
    } finally {
      setRemoving(false);
    }
  }

  const initials = account.account_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-t border-[#f0e2b2]/60 hover:bg-[#fffbe8]/70 transition-colors duration-150">
      {account.profile_picture_url ? (
        <img
          src={account.profile_picture_url}
          alt={account.account_name}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-[#eadba6] flex-shrink-0"
        />
      ) : (
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: platform.bg, color: platform.textColor }}
        >
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink-900 truncate">{account.account_name}</p>
        {account.account_type && (
          <p className="text-[11px] text-ink-500 capitalize">{account.account_type}</p>
        )}
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8d8] px-2 py-0.5 text-[10px] font-semibold text-[#527227]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#8dc63f]" />
        Active
      </span>
      <button
        type="button"
        onClick={() => void handleRemove()}
        disabled={removing}
        className="flex items-center gap-1 rounded-full border border-[#f0d5d5] bg-[#fff5f5] px-2.5 py-1 text-[11px] font-medium text-[#c0392b] transition-all hover:bg-[#ffe8e8] hover:border-[#e0b0b0] disabled:opacity-40"
      >
        <TrashIcon />
        Remove
      </button>
    </div>
  );
}

function PlatformRow({
  platform,
  connected,
  accounts,
  onConnect,
  onRemove,
}: {
  platform: (typeof platformMeta)[0];
  connected: boolean;
  accounts: Account[];
  onConnect: (key: PlatformName, addAnother?: boolean) => void;
  onRemove: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-[20px] border border-[#eadba6] bg-[#fffdf8]/90 overflow-hidden transition-shadow duration-200"
      style={{
        boxShadow: expanded ? "0 8px 28px rgba(180,144,34,0.10)" : "0 2px 8px rgba(180,144,34,0.05)",
        borderLeft: connected ? `3px solid ${platform.color}` : undefined,
      }}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px]"
          style={{ background: platform.bg, color: platform.textColor }}
        >
          <PlatformLogo platform={platform.key} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-ink-900">{platform.label}</span>
            {connected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#eef8d8] px-2 py-0.5 text-[10px] font-semibold text-[#527227]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8dc63f]" />
                {accounts.length} connected
              </span>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-0.5">{platform.hint}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => void onConnect(platform.key, connected)}
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150"
            style={
              connected
                ? { background: platform.bg, color: platform.textColor, border: `1px solid ${platform.color}30` }
                : { background: "#ffd52a", color: "#09090e", boxShadow: "0 4px 12px rgba(255,213,42,0.30)", border: "1px solid transparent" }
            }
          >
            <PlusIcon />
            {connected ? "Add account" : "Connect"}
          </button>
          {connected && accounts.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eadba6] bg-[#fffbe8] text-ink-600 transition-all hover:bg-[#fff3c8] hover:border-[#ffd52a]"
              aria-label="Toggle accounts"
            >
              <ChevronIcon open={expanded} />
            </button>
          )}
        </div>
      </div>
      {expanded && accounts.length > 0 && (
        <div className="border-t border-[#f0e2b2]/70 bg-[#fffbf0]/60">
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} onRemove={onRemove} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
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

  function handleRemoveAccount(id: number) {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
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
  const accountsByPlatform = useMemo(
    () =>
      platformMeta.reduce<Record<PlatformName, Account[]>>((acc, platform) => {
        acc[platform.key] = activeAccounts.filter(
          (account) => normalizePlatform(account.platform) === platform.key,
        );
        return acc;
      }, {} as Record<PlatformName, Account[]>),
    [activeAccounts],
  );

  const connectedCount = platformMeta.filter((p) => status[p.key].connected).length;

  return (
    <main className="min-h-[calc(100vh-2.5rem)] px-4 py-4 sm:px-5 lg:px-6">
      <div className="rounded-[30px] border border-[#eadba6] bg-[linear-gradient(145deg,#fffdf7_0%,#fff8e8_45%,#fff3d6_100%)] p-5 shadow-[0_18px_48px_rgba(180,144,34,0.09)] sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c49a00]">
              Social Connections
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-ink-900 sm:text-4xl">
              Connected Channels
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-ink-600">
              Manage your social accounts from one place. Connect new profiles or remove existing ones below.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap lg:flex-nowrap">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#eadba6] bg-[#fffbe8]/80 px-5 py-3 min-w-[96px]">
              <span className="text-2xl font-bold text-ink-900">{activeAccounts.length}</span>
              <span className="text-[11px] text-ink-500 mt-0.5">Active accounts</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#eadba6] bg-[#fffbe8]/80 px-5 py-3 min-w-[96px]">
              <span className="text-2xl font-bold text-ink-900">{connectedCount}</span>
              <span className="text-[11px] text-ink-500 mt-0.5">Platforms live</span>
            </div>
          </div>
        </div>

        <ErrorNotice error={error} fallback="We couldn't load social account connections right now." />

        {/* Platform list */}
        <div className="flex flex-col gap-3">
          {platformMeta.map((platform) => (
            <PlatformRow
              key={platform.key}
              platform={platform}
              connected={status[platform.key].connected}
              accounts={accountsByPlatform[platform.key] ?? []}
              onConnect={handleOAuthConnect}
              onRemove={handleRemoveAccount}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          Click <strong className="font-semibold text-ink-700">Connect</strong> to authorise a platform ·
          Use the <strong className="font-semibold text-ink-700">↓</strong> chevron to view and manage connected accounts
        </p>
      </div>
    </main>
  );
}
