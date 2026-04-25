"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import { ErrorNotice } from "@/components/error-notice";
import { PostComposerModal } from "@/components/post-composer-modal-v2";
import { AccountsIcon, ChainIcon, CheckBadgeIcon, EmptyPostsIcon, PlatformLogo, QueueIcon, StatIcon, StatusBadge, formatDate, platformMeta } from "@/components/dashboard-helpers";
import { beginOAuthLogin, connectWordpressSite, fetchAccounts, fetchAccountStatus, fetchPosts } from "@/lib/api";
import { getReadableError } from "@/lib/error-utils";
import { Account, AccountStatusResponse, PlatformName, Post } from "@/lib/types";

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

export function DashboardScreen() {
  const [status, setStatus] = useState<AccountStatusResponse>(emptyStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
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
      const [statusData, accountData, postData] = await Promise.all([fetchAccountStatus(), fetchAccounts(), fetchPosts()]);
      setStatus(statusData);
      setAccounts(accountData);
      setPosts(postData);
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
      text: oauthResult === "success" ? `${platformLabel}: ${oauthMessage}${oauthCount ? ` Added account count: ${oauthCount}.` : ""}` : `${platformLabel}: ${oauthMessage}`,
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
    const queuedPosts = posts.filter((post) => ["pending", "queued", "scheduled", "processing"].includes(post.status)).length;
    const posted = posts.filter((post) => post.status === "posted").length;
    return { connectedPlatforms, totalAccounts, queuedPosts, posted };
  }, [accounts, posts, status]);

  const accountsByPlatform = useMemo(() => platformMeta.reduce<Record<PlatformName, Account[]>>((acc, platform) => {
    acc[platform.key] = accounts.filter((account) => account.is_active && normalizePlatform(account.platform) === platform.key);
    return acc;
  }, {} as Record<PlatformName, Account[]>), [accounts]);

  const recentPosts = [...posts].sort((a, b) => new Date(b.scheduled_at ?? b.created_at ?? 0).getTime() - new Date(a.scheduled_at ?? a.created_at ?? 0).getTime()).slice(0, 6);

  const statItems: Array<{ label: string; value: number; note: string; trend: string; color: string; trendClass: string; iconWrapClass: string; icon: ReactNode }> = [
    { label: "Active Accounts", value: stats.totalAccounts, note: "Connected and ready to publish", trend: stats.totalAccounts === 0 ? "Start here" : `${stats.totalAccounts} live now`, color: "from-[#0d0b14] via-[#fff5dc] to-[#ffeac1]", trendClass: "bg-[#fff2c7] text-[#8e6700]", iconWrapClass: "bg-[#fff1c4] text-[#8e6700]", icon: <AccountsIcon /> },
    { label: "Live Platforms", value: stats.connectedPlatforms, note: "Distribution channels available", trend: stats.connectedPlatforms === 0 ? "Needs setup" : "Publishing unlocked", color: "from-[#eff6ff] via-[#e7f1ff] to-[#d8e8ff]", trendClass: "bg-[#dbeafe] text-[#2157b2]", iconWrapClass: "bg-[#dbeafe] text-[#2157b2]", icon: <ChainIcon /> },
    { label: "In Queue", value: stats.queuedPosts, note: "Scheduled or processing posts", trend: stats.queuedPosts === 0 ? "Queue is clear" : "Delivery in motion", color: "from-[#fff7ee] via-[#fff0de] to-[#ffe2bb]", trendClass: "bg-[#ffe5c6] text-[#ad5e00]", iconWrapClass: "bg-[#ffe9cf] text-[#ad5e00]", icon: <QueueIcon /> },
    { label: "Published", value: stats.posted, note: "Successful deliveries so far", trend: stats.posted === 0 ? "No wins yet" : "Healthy output", color: "from-[#f3fbef] via-[#eaf8e2] to-[#daf0c9]", trendClass: "bg-[#dff2cf] text-[#3f6d20]", iconWrapClass: "bg-[#dff2cf] text-[#3f6d20]", icon: <CheckBadgeIcon /> },
  ];

  return (
    <>
      <main className="flex min-h-[calc(100vh-2.5rem)] flex-col">
        <div className="flex-1 space-y-6 px-5 py-6 sm:px-8">
          <section className="fade-up rounded-[28px] border border-[#efe7d8] bg-[linear-gradient(135deg,#fffef9_0%,#fff9e8_50%,#fff5d5_100%)] p-6 shadow-[0_12px_40px_rgba(24,24,24,0.05)] sm:p-8">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#ffd52a]">Social Publishing Dashboard</p>
                <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-ink-900 sm:text-4xl">Welcome back</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-ink-600">Manage channels, launch posts, and monitor delivery, all in one place.</p>
              </div>
              <button type="button" onClick={() => setComposerOpen(true)} className="primary-button group flex items-center gap-2 self-start whitespace-nowrap px-8 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"><span className="text-xl transition-transform duration-300 group-hover:rotate-90">+</span><span>New Post</span></button>
            </div>
            {error ? <div className="mb-4"><ErrorNotice error={error} fallback="We couldn't load the dashboard right now." /></div> : null}
            {oauthBanner ? <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${oauthBanner.tone === "success" ? "border-[#d7e9c0] bg-[#f7fbef] text-[#53722c]" : "border-[#3a1515] bg-[#2a100e] text-[#f07070]"}`}>{oauthBanner.text}</div> : null}
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {statItems.map((item, index) => <div key={item.label} className={`stat-card fade-up fade-up-${index + 1} rounded-[22px] border border-[#252030] bg-gradient-to-br ${item.color} p-5`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-[#ffd52a]">{item.label}</div><p className="mt-2 text-xs text-ink-500">{item.note}</p></div><StatIcon className={item.iconWrapClass}>{item.icon}</StatIcon></div><div className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-ink-900">{item.value}</div><div className="mt-3 flex items-center justify-between gap-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.trendClass}`}>{item.trend}</span><span className="text-[11px] uppercase tracking-[0.12em] text-ink-400">Live</span></div></div>)}
            </div>
          </section>

          <section className="fade-up fade-up-2 grid gap-6 2xl:grid-cols-[1.5fr_0.85fr]">
            <div className="panel p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold tracking-[-0.05em]">Connected Channels</h2><p className="mt-1 text-sm text-ink-600">Click a platform to connect or manage your account.</p></div><span className="rounded-full bg-[#141924] px-3 py-1 text-xs font-semibold text-[#ab8b3b]">{stats.connectedPlatforms} live</span></div>
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {platformMeta.map((platform, index) => {
                  const platformAccounts = accountsByPlatform[platform.key] ?? [];
                  const connected = status[platform.key].connected;
                  return <button key={platform.key} type="button" onClick={() => void handleOAuthConnect(platform.key, platformAccounts.length > 0)} style={{ animationDelay: `${0.05 + index * 0.06}s` }} className={`platform-card fade-up group rounded-[24px] border p-5 text-left ${connected ? `border-[#eadfcd] bg-gradient-to-br shadow-[0_14px_30px_rgba(24,24,24,0.05)] ${platform.gradient}` : "border-dashed border-[#e6dcc8] bg-[#141924]"}`}><div className="flex items-start justify-between gap-3"><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${platform.tone} transition-transform group-hover:scale-110`}><PlatformLogo platform={platform.key} className="h-6 w-6" /></div><div className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${connected ? "bg-[#eef8d8] text-[#527227]" : "bg-[#f1ebe0] text-[#8b7d68]"}`}><span className={`pulse-dot h-2 w-2 rounded-full ${connected ? "bg-[#8dc63f]" : "bg-[#c7bca9]"}`} /><span>{connected ? "Live" : "Disconnected"}</span></div></div><div className="mt-4"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-semibold text-ink-900">{platform.label}</h3>{connected ? <span className="rounded-full bg-[#0d1018]/85 px-2.5 py-1 text-[11px] font-semibold text-[#6d5a22] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">Ready</span> : null}</div><p className={`mt-0.5 text-xs ${connected ? "text-ink-600" : "text-ink-500"}`}>{platformAccounts.length ? platformAccounts.slice(0, 2).map((account) => account.account_name).join(", ") : platform.hint}</p>{!connected ? <p className="mt-3 text-xs leading-5 text-ink-500">Connect this channel to unlock publishing, scheduling, and account-specific settings.</p> : null}</div><div className="mt-4 flex items-end justify-between gap-3"><span className={`text-xs font-medium ${connected ? "text-ink-600" : "text-ink-500"}`}>{platformAccounts.length} account{platformAccounts.length === 1 ? "" : "s"}</span><span className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${connected ? "border border-[#f3d97c] bg-[#ffe274] text-ink-900 shadow-[0_8px_20px_rgba(244,180,0,0.18)]" : "border border-[#e4dac8] bg-[#0d1018] text-ink-700 group-hover:border-[#cfbea0] group-hover:bg-[#fffaf0]"}`}>{connected && platformAccounts.length ? "Manage" : "+ Connect"}</span></div></button>;
                })}
              </div>
            </div>
            <div className="panel flex flex-col p-5 sm:p-6">
              <div className="mb-5"><h2 className="font-display text-2xl font-semibold tracking-[-0.05em]">Quick Compose</h2><p className="mt-1 text-sm text-ink-600">Launch the composer and publish with platform-specific fields.</p></div>
              <button type="button" onClick={() => setComposerOpen(true)} className="field-input group mb-4 min-h-[100px] cursor-text text-left text-base text-ink-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"><span className="transition-colors duration-150 group-hover:text-brand-600">What's on your mind?</span></button>
              <div className="mb-4 flex flex-wrap gap-2">{platformMeta.filter((platform) => status[platform.key].connected).slice(0, 3).map((platform) => <span key={platform.key} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${platform.tone}`}><PlatformLogo platform={platform.key} className="h-3 w-3" />{platform.label}</span>)}{stats.connectedPlatforms === 0 ? <span className="text-xs text-ink-500">Connect a platform to start posting</span> : null}</div>
              <div className="mt-auto rounded-[20px] border border-[#252030] bg-gradient-to-br from-[#0d0b14] to-[#100e1a] p-4"><p className="text-sm font-medium leading-6 text-ink-700">{stats.queuedPosts > 0 ? `${stats.queuedPosts} post${stats.queuedPosts > 1 ? "s" : ""} queued for delivery` : "Schedule your first post today"}</p><p className="mt-1 text-xs text-ink-500">{stats.connectedPlatforms} platform{stats.connectedPlatforms !== 1 ? "s" : ""} ready</p><button type="button" onClick={() => setComposerOpen(true)} className="primary-button mt-4 w-full py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-0">Open Composer</button></div>
            </div>
          </section>

          <section className="fade-up fade-up-3 panel p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold tracking-[-0.05em]">Recent Posts</h2><p className="mt-1 text-sm text-ink-600">Latest activity across all platforms.</p></div><a href="/posts" className="secondary-button px-4 py-2 text-xs">View All -&gt;</a></div>
            {recentPosts.length ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{recentPosts.map((post, index) => <div key={post.id} className="post-card rounded-[22px] border border-[#efe6d8] bg-[#fffcf6] p-4" style={{ animationDelay: `${0.05 + index * 0.05}s` }}><div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#ffd52a]">{formatDate(post.scheduled_at ?? post.created_at)}</span><StatusBadge status={post.status} /></div><p className="line-clamp-3 text-sm leading-6 text-ink-800">{post.content || "No content"}</p><div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-500"><span className="font-medium capitalize">{post.platform}</span><span>#{post.id}</span></div></div>)}</div> : <div className="rounded-[22px] border border-dashed border-[#e5dbc8] bg-[#141924] px-4 py-12 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1c9] text-[#946a00] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"><EmptyPostsIcon /></div><p className="text-sm text-ink-500">No posts yet. Start with a new draft and we&apos;ll show the latest activity here.</p><button type="button" onClick={() => setComposerOpen(true)} className="primary-button mt-5 px-6 py-3 text-sm font-semibold">Create Your First Post</button></div>}
          </section>

          <section className="fade-up fade-up-4 grid gap-6 2xl:grid-cols-[0.6fr_1.4fr]">
            <div className="panel p-5 sm:p-6"><h2 className="font-display text-xl font-semibold tracking-[-0.05em]">Publishing Health</h2><p className="mt-1 text-sm text-ink-600">Quick workspace status.</p><div className="mt-5 space-y-4">{[{ label: "Success Rate", value: posts.length ? Math.round((stats.posted / posts.length) * 100) : 100, color: "bg-[#8dc63f]" }, { label: "Queue Load", value: posts.length ? Math.round((stats.queuedPosts / Math.max(posts.length, 1)) * 100) : 0, color: "bg-[#f4b400]" }].map((item) => <div key={item.label}><div className="mb-1.5 flex justify-between text-xs font-medium text-ink-700"><span>{item.label}</span><span>{item.value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#efe6d7]"><div className={`h-2 rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.value}%` }} /></div></div>)}</div></div>
            <div className="panel p-5 sm:p-6"><h2 className="font-display text-xl font-semibold tracking-[-0.05em]">Activity Feed</h2><p className="mt-1 text-sm text-ink-600">Recent post outcomes across your workspace.</p><div className="mt-5 space-y-2.5">{recentPosts.slice(0, 4).map((post) => <div key={post.id} className="flex items-start gap-3 rounded-2xl border border-[#eee4d6] bg-[#0d0b14] p-3.5 transition-colors hover:bg-[#141924]"><div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${post.status === "posted" ? "bg-[#8dc63f]" : post.status === "failed" ? "bg-[#d86b60]" : "bg-[#f4b400]"}`} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-sm font-medium capitalize text-ink-900">{post.platform}</span><span className="text-xs text-ink-500">#{post.id}</span><StatusBadge status={post.status} /></div><p className="mt-0.5 truncate text-sm text-ink-600">{post.error_message ? getReadableError(post.error_message, { fallback: `We couldn't finish this ${post.platform} post.` }).summary : post.content || "Waiting for execution."}</p></div><span className="shrink-0 whitespace-nowrap text-xs text-ink-400">{formatDate(post.updated_at ?? post.created_at)}</span></div>)}{!recentPosts.length ? <p className="py-4 text-center text-sm text-ink-500">No activity yet.</p> : null}</div></div>
          </section>
        </div>
      </main>
      <PostComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} onCreated={load} />
    </>
  );
}
