"use client";

import { useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { beginOAuthLogin, connectWordpressSite, deactivateAccount, fetchAccounts, fetchAccountStatus } from "@/lib/api";
import { Account, AccountStatusResponse, PlatformName } from "@/lib/types";

// ─── platform config ────────────────────────────────────────────────────────
const platformMeta: Array<{
  key: PlatformName;
  label: string;
  hint: string;
  color: string;
  iconBg: string;
  iconColor: string;
}> = [
  { key: "facebook",        label: "Facebook",        hint: "Pages & Groups",        color: "#1877f2", iconBg: "rgba(24,119,242,0.12)",  iconColor: "#1877f2" },
  { key: "instagram",       label: "Instagram",       hint: "Business & Creator",     color: "#e1306c", iconBg: "rgba(225,48,108,0.12)",  iconColor: "#e1306c" },
  { key: "linkedin",        label: "LinkedIn",        hint: "Profiles & Pages",       color: "#0a66c2", iconBg: "rgba(10,102,194,0.12)",  iconColor: "#0a66c2" },
  { key: "twitter",         label: "X (Twitter)",     hint: "Text-first publishing",  color: "#111111", iconBg: "rgba(0,0,0,0.08)",       iconColor: "#111111" },
  { key: "youtube",         label: "YouTube",         hint: "Video publishing",       color: "#ff0000", iconBg: "rgba(255,0,0,0.10)",     iconColor: "#ff0000" },
  { key: "blogger",         label: "Blogger",         hint: "Blog publishing",        color: "#ef6c00", iconBg: "rgba(239,108,0,0.10)",   iconColor: "#ef6c00" },
  { key: "google_business", label: "Google Business", hint: "Business updates",       color: "#1a73e8", iconBg: "rgba(26,115,232,0.10)",  iconColor: "#1a73e8" },
  { key: "wordpress",       label: "WordPress",       hint: "Website blog",           color: "#3858e9", iconBg: "rgba(56,88,233,0.10)",   iconColor: "#3858e9" },
];

const emptyStatus: AccountStatusResponse = {
  facebook:        { connected: false, active_accounts: 0 },
  instagram:       { connected: false, active_accounts: 0 },
  linkedin:        { connected: false, active_accounts: 0 },
  twitter:         { connected: false, active_accounts: 0 },
  youtube:         { connected: false, active_accounts: 0 },
  blogger:         { connected: false, active_accounts: 0 },
  google_business: { connected: false, active_accounts: 0 },
  wordpress:       { connected: false, active_accounts: 0 },
};

function normalizePlatform(v: string | null | undefined): PlatformName {
  return (v ?? "").trim().toLowerCase() as PlatformName;
}

// ─── inline icons ────────────────────────────────────────────────────────────
function PlatformIcon({ platform, color, size = 22 }: { platform: PlatformName; color: string; size?: number }) {
  const s = size;
  switch (platform) {
    case "facebook":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M13.6 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.7-1.6h1.7V4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4v2.4H8v3.2h2.8V22h2.8Z"/></svg>;
    case "instagram":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9"><rect x="4.5" y="4.5" width="15" height="15" rx="4.25"/><circle cx="12" cy="12" r="3.6"/><circle cx="17.1" cy="6.9" r="1" fill={color} stroke="none"/></svg>;
    case "linkedin":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M6.4 8.2a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Zm-1.6 2.1H8v9.3H4.8v-9.3Zm5 0H13v1.3h.1c.4-.8 1.5-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.9v4.8h-3.3v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3h-3.3v-9.3Z"/></svg>;
    case "twitter":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M17.8 4.5h2.7l-5.9 6.7 6.9 8.3H16l-4.2-5-4.4 5H4.7l6.3-7.2-6.6-7.9H10l3.8 4.6 4-4.5Zm-.9 13.4h1.5L9.2 6H7.6l9.3 11.9Z"/></svg>;
    case "youtube":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M20.4 8.1a2.7 2.7 0 0 0-1.9-1.9C16.8 5.7 12 5.7 12 5.7s-4.8 0-6.5.5a2.7 2.7 0 0 0-1.9 1.9c-.5 1.7-.5 3.9-.5 3.9s0 2.2.5 3.9a2.7 2.7 0 0 0 1.9 1.9c1.7.5 6.5.5 6.5.5s4.8 0 6.5-.5a2.7 2.7 0 0 0 1.9-1.9c.5-1.7.5-3.9.5-3.9s0-2.2-.5-3.9ZM10.4 14.6V9.4l4.6 2.6-4.6 2.6Z"/></svg>;
    case "blogger":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M6 4.5h7.5a4.5 4.5 0 0 1 4.5 4.5v.8a1.2 1.2 0 0 0 1.2 1.2h.3v4A4.5 4.5 0 0 1 15 19.5H9A4.5 4.5 0 0 1 4.5 15V6A1.5 1.5 0 0 1 6 4.5Zm3 5.3h4.6a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2Zm0 4.2h6a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2Z"/></svg>;
    case "google_business":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v12A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V6Zm3 2.2V15h3.7c2.9 0 4.8-1.4 4.8-3.4 0-1.2-.7-2.1-1.8-2.6.7-.5 1.1-1.2 1.1-2.1 0-1.7-1.4-2.7-3.9-2.7H7.5Zm2.3 2h1.8c.9 0 1.4.4 1.4 1s-.5 1-1.4 1H9.8v-2Zm0-3.8h1.5c.8 0 1.2.3 1.2.9 0 .5-.4.9-1.2.9H9.8V6.4Z"/></svg>;
    case "wordpress":
      return <svg width={s} height={s} viewBox="0 0 24 24" fill={color}><path d="M12 4.5A7.5 7.5 0 1 0 19.5 12 7.5 7.5 0 0 0 12 4.5Zm0 13.2a5.7 5.7 0 0 1-2.8-.7l3-8.3c.4 0 .8 0 1.1-.1-.3-.1-.9-.1-1.5-.1-.5 0-.9 0-1.2.1A5.8 5.8 0 0 1 16 8.3l.1.1c-.4 0-.8.1-1.1.1-.4 0-.7.3-.6.7l1.9 5.5a5.7 5.7 0 0 1-4.3 3ZM7.7 8.9c0-.2 0-.5.1-.7l2.3 6.4-1 2.8A5.7 5.7 0 0 1 7.7 8.9Zm9.6 6-.6-1.8c.3-.8.5-1.6.5-2.3 0-.9-.3-1.5-.6-2-.2-.3-.3-.5-.3-.8 0-.3.2-.6.6-.6h.1a5.7 5.7 0 0 1 .3 7.5Z"/></svg>;
    default:
      return null;
  }
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b8955a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}

// ─── account row ─────────────────────────────────────────────────────────────
function AccountRow({ account, onRemove }: { account: Account; onRemove: (id: number) => Promise<void> }) {
  const [removing, setRemoving] = useState(false);
  const [hover, setHover] = useState(false);

  async function handleRemove() {
    if (!confirm(`Remove "${account.account_name}"?`)) return;
    setRemoving(true);
    try { await onRemove(account.id); } finally { setRemoving(false); }
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "9px 14px",
      borderRadius: 13,
      background: "rgba(255,255,255,0.62)",
      border: "1px solid rgba(212,170,90,0.2)",
      marginBottom: 7,
    }}>
      {account.profile_picture_url ? (
        <img src={account.profile_picture_url} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(212,170,90,0.3)" }} />
      ) : (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#f5e4b0,#e8c96a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#8a6520" }}>
          {account.account_name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3b2a0e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.account_name}</div>
        {account.account_type && <div style={{ fontSize: 11, color: "#9b7d42", textTransform: "capitalize" }}>{account.account_type.replace(/_/g, " ")}</div>}
      </div>
      <button type="button" onClick={() => void handleRemove()} disabled={removing} title="Remove"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 28, height: 28, borderRadius: 8,
          background: hover ? "rgba(220,80,60,0.09)" : "transparent",
          border: hover ? "1px solid rgba(220,80,60,0.28)" : "1px solid transparent",
          color: "#c0614a", cursor: removing ? "not-allowed" : "pointer",
          opacity: removing ? 0.45 : 1, transition: "background 0.14s, border-color 0.14s",
        }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
        </svg>
      </button>
    </div>
  );
}

// ─── platform accordion card ─────────────────────────────────────────────────
function PlatformCard({ meta, accounts, connected, onConnect, onRemoveAccount }: {
  meta: typeof platformMeta[number];
  accounts: Account[];
  connected: boolean;
  onConnect: (addAnother?: boolean) => void;
  onRemoveAccount: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  return (
    <div style={{
      borderRadius: 20,
      border: open ? `1.5px solid ${meta.color}55` : "1.5px solid rgba(212,170,90,0.3)",
      background: open ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.55)",
      boxShadow: open ? `0 6px 28px rgba(0,0,0,0.07), 0 0 0 3px ${meta.color}14` : "0 2px 8px rgba(0,0,0,0.04)",
      transition: "box-shadow 0.22s, border-color 0.22s, background 0.22s",
      overflow: "hidden",
    }}>

      {/* header */}
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "13px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        {/* accent bar */}
        <div style={{ width: 3, alignSelf: "stretch", borderRadius: 3, background: connected ? meta.color : "rgba(212,170,90,0.28)", flexShrink: 0, transition: "background 0.2s" }} />

        {/* icon */}
        <div style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: meta.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PlatformIcon platform={meta.key} color={meta.iconColor} size={22} />
        </div>

        {/* text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#2d1f00", letterSpacing: "-0.01em" }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: "#a07d3a", marginTop: 1 }}>
            {connected ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""} connected` : meta.hint}
          </div>
        </div>

        {/* status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          borderRadius: 100, padding: "4px 11px",
          fontSize: 11, fontWeight: 700,
          background: connected ? `${meta.color}18` : "rgba(212,170,90,0.14)",
          color: connected ? meta.color : "#b89450",
          border: `1px solid ${connected ? meta.color + "44" : "rgba(212,170,90,0.32)"}`,
          flexShrink: 0,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? meta.color : "#d4a83a", flexShrink: 0 }} />
          {connected ? "Connected" : "Not connected"}
        </div>

        <ChevronDown open={open} />
      </button>

      {/* expanded body */}
      {open && (
        <div style={{ padding: "4px 18px 16px", borderTop: "1px solid rgba(212,170,90,0.2)" }}>
          {accounts.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              {accounts.map(acc => <AccountRow key={acc.id} account={acc} onRemove={onRemoveAccount} />)}
            </div>
          ) : (
            <div style={{ marginTop: 12, borderRadius: 13, border: "1.5px dashed rgba(212,170,90,0.35)", padding: "18px 16px", textAlign: "center", fontSize: 13, color: "#b89450" }}>
              No accounts connected yet.
            </div>
          )}

          <button type="button" onClick={() => onConnect(accounts.length > 0)}
            onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}
            style={{
              marginTop: 12, display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 12,
              border: `1.5px solid ${meta.color}${btnHover ? "88" : "55"}`,
              background: `${meta.color}${btnHover ? "22" : "12"}`,
              color: meta.color, fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            {accounts.length > 0 ? "Add another account" : "Connect account"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function ConnectionsClient() {
  const [status, setStatus]     = useState<AccountStatusResponse>(emptyStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError]       = useState<string | null>(null);

  async function handleOAuthConnect(platform: PlatformName, addAnother = false) {
    try {
      setError(null);
      if (platform === "wordpress") {
        const site_url             = window.prompt("WordPress site URL");
        if (!site_url) return;
        const username             = window.prompt("WordPress username");
        if (!username) return;
        const application_password = window.prompt("WordPress application password");
        if (!application_password) return;
        await connectWordpressSite({ site_url, username, application_password });
        await load();
        return;
      }
      await beginOAuthLogin(platform, { addAnother });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to start social login.");
    }
  }

  async function handleRemoveAccount(id: number) {
    try {
      await deactivateAccount(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to remove account.");
    }
  }

  async function load() {
    try {
      const [statusData, accountData] = await Promise.all([fetchAccountStatus(), fetchAccounts()]);
      setStatus(statusData);
      setAccounts(accountData.filter(a => a.is_active));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load connections.");
    }
  }

  useEffect(() => { void load(); }, []);

  const accountsByPlatform = useMemo(() =>
    platformMeta.reduce<Record<PlatformName, Account[]>>((acc, p) => {
      acc[p.key] = accounts.filter(a => normalizePlatform(a.platform) === p.key);
      return acc;
    }, {} as Record<PlatformName, Account[]>),
  [accounts]);

  return (
    <main style={{
      minHeight: "calc(100vh - 2.5rem)",
      padding: "28px 16px 40px",
      background: "linear-gradient(135deg, #fffde7 0%, #fff8d6 35%, #fef3b4 65%, #fde68a 100%)",
    }}>
      {/* header */}
      <div style={{ maxWidth: 760, margin: "0 auto 26px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b8955a", marginBottom: 6 }}>
              Social Connections
            </div>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#2d1f00", margin: 0, lineHeight: 1.1 }}>
              Manage your channels
            </h1>
            <p style={{ fontSize: 13.5, color: "#9b7d42", marginTop: 6, lineHeight: 1.6 }}>
              Tap any platform to expand — see connected accounts, add new ones, or remove existing ones.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, borderRadius: 100, padding: "7px 16px", background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(212,170,90,0.42)", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", fontSize: 13, fontWeight: 700, color: "#8a6520", whiteSpace: "nowrap" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#d4a83a" }} />
            {accounts.length} active account{accounts.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* error */}
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <ErrorNotice error={error} fallback="We couldn't load social account connections right now." />
      </div>

      {/* accordion list */}
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        {platformMeta.map(meta => (
          <PlatformCard
            key={meta.key}
            meta={meta}
            accounts={accountsByPlatform[meta.key] ?? []}
            connected={status[meta.key].connected}
            onConnect={(addAnother) => void handleOAuthConnect(meta.key, addAnother)}
            onRemoveAccount={handleRemoveAccount}
          />
        ))}
      </div>
    </main>
  );
}