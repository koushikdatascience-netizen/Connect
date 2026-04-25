"use client";

import { ReactNode } from "react";

import { PlatformName } from "@/lib/types";

export const platformMeta: Array<{ key: PlatformName; label: string; hint: string; tone: string; gradient: string }> = [
  { key: "facebook", label: "Facebook", hint: "Pages & Groups", tone: "bg-[#0e1830] text-[#6ea8fe]", gradient: "from-[#1877f2]/15 via-[#edf3ff] to-white" },
  { key: "instagram", label: "Instagram", hint: "Business / Creator", tone: "bg-[#2a0f1e] text-[#f472b6]", gradient: "from-[#f7d6e4] via-[#fff1f6] to-white" },
  { key: "linkedin", label: "LinkedIn", hint: "Profiles & Pages", tone: "bg-[#0c1e30] text-[#60a5fa]", gradient: "from-[#d9ebff] via-[#eef7ff] to-white" },
  { key: "twitter", label: "X (Twitter)", hint: "Text first", tone: "bg-[#0d0d0d] text-white", gradient: "from-[#d9d9d9] via-white to-[#f7f7f7]" },
  { key: "youtube", label: "YouTube", hint: "Video publishing", tone: "bg-[#2a0f0e] text-[#f87171]", gradient: "from-[#ffe1dd] via-[#fff3f1] to-white" },
  { key: "blogger", label: "Blogger", hint: "Blog publishing", tone: "bg-[#2a1508] text-[#fb923c]", gradient: "from-[#ffe1c7] via-[#fff3e8] to-white" },
  { key: "google_business", label: "Google Business", hint: "Business updates", tone: "bg-[#0c1e30] text-[#60a5fa]", gradient: "from-[#dbe9ff] via-[#eef5ff] to-white" },
  { key: "wordpress", label: "WordPress", hint: "Website blog", tone: "bg-[#141924] text-[#9aa4b2]", gradient: "from-[#dce4ea] via-[#f5f7f8] to-white" },
];

export function PlatformLogo({ platform, className = "h-6 w-6" }: { platform: PlatformName; className?: string }) {
  switch (platform) {
    case "facebook":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M13.6 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.7-1.6h1.7V4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.4v2.4H8v3.2h2.8V22h2.8Z" /></svg>;
    case "instagram":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4.5" y="4.5" width="15" height="15" rx="4.25" /><circle cx="12" cy="12" r="3.6" /><circle cx="17.1" cy="6.9" r="1" fill="currentColor" stroke="none" /></svg>;
    case "linkedin":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M6.4 8.2a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Zm-1.6 2.1H8v9.3H4.8v-9.3Zm5 0H13v1.3h.1c.4-.8 1.5-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.9v4.8h-3.3v-4.2c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2v4.3h-3.3v-9.3Z" /></svg>;
    case "twitter":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M17.8 4.5h2.7l-5.9 6.7 6.9 8.3H16l-4.2-5-4.4 5H4.7l6.3-7.2-6.6-7.9H10l3.8 4.6 4-4.5Zm-.9 13.4h1.5L9.2 6h-1.6l9.3 11.9Z" /></svg>;
    case "youtube":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M20.4 8.1a2.7 2.7 0 0 0-1.9-1.9C16.8 5.7 12 5.7 12 5.7s-4.8 0-6.5.5a2.7 2.7 0 0 0-1.9 1.9c-.5 1.7-.5 3.9-.5 3.9s0 2.2.5 3.9a2.7 2.7 0 0 0 1.9 1.9c1.7.5 6.5.5 6.5.5s4.8 0 6.5-.5a2.7 2.7 0 0 0 1.9-1.9c.5-1.7.5-3.9.5-3.9s0-2.2-.5-3.9ZM10.4 14.6V9.4l4.6 2.6-4.6 2.6Z" /></svg>;
    case "blogger":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M6 4.5h7.5a4.5 4.5 0 0 1 4.5 4.5v.8a1.2 1.2 0 0 0 1.2 1.2h.3v4A4.5 4.5 0 0 1 15 19.5H9A4.5 4.5 0 0 1 4.5 15V6A1.5 1.5 0 0 1 6 4.5Zm3 5.3h4.6a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2Zm0 4.2h6a1 1 0 1 0 0-2H9a1 1 0 1 0 0 2Z" /></svg>;
    case "google_business":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M4.5 6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v12A1.5 1.5 0 0 1 18 19.5H6A1.5 1.5 0 0 1 4.5 18V6Zm3 2.2V15h3.7c2.9 0 4.8-1.4 4.8-3.4 0-1.2-.7-2.1-1.8-2.6.7-.5 1.1-1.2 1.1-2.1 0-1.7-1.4-2.7-3.9-2.7H7.5Zm2.3 2h1.8c.9 0 1.4.4 1.4 1s-.5 1-1.4 1H9.8v-2Zm0-3.8h1.5c.8 0 1.2.3 1.2.9 0 .5-.4.9-1.2.9H9.8V6.4Z" /></svg>;
    case "wordpress":
      return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d="M12 4.5A7.5 7.5 0 1 0 19.5 12 7.5 7.5 0 0 0 12 4.5Zm0 13.2a5.7 5.7 0 0 1-2.8-.7l3-8.3c.4 0 .8 0 1.1-.1-.3-.1-.9-.1-1.5-.1-.5 0-.9 0-1.2.1A5.8 5.8 0 0 1 16 8.3l.1.1c-.4 0-.8.1-1.1.1-.4 0-.7.3-.6.7l1.9 5.5a5.7 5.7 0 0 1-4.3 3ZM7.7 8.9c0-.2 0-.5.1-.7l2.3 6.4-1 2.8A5.7 5.7 0 0 1 7.7 8.9Zm9.6 6-.6-1.8c.3-.8.5-1.6.5-2.3 0-.9-.3-1.5-.6-2-.2-.3-.3-.5-.3-.8 0-.3.2-.6.6-.6h.1a5.7 5.7 0 0 1 .3 7.5Z" /></svg>;
    default:
      return null;
  }
}

export function StatIcon({ children, className }: { children: ReactNode; className: string }) {
  return <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${className}`}>{children}</span>;
}

function StrokeIcon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

export function AccountsIcon() { return <StrokeIcon><path d="M15.5 19v-1.2a3.3 3.3 0 0 0-3.3-3.3H7.8a3.3 3.3 0 0 0-3.3 3.3V19" /><circle cx="10" cy="8.5" r="3.2" /><path d="M17 11.2a2.8 2.8 0 0 1 0 5.6" /><path d="M19.3 19v-.9a2.7 2.7 0 0 0-2.1-2.6" /></StrokeIcon>; }
export function ChainIcon() { return <StrokeIcon><path d="M10.5 13.5 8.3 15.7a3.1 3.1 0 1 1-4.4-4.4l2.2-2.2a3.1 3.1 0 0 1 4.4 0" /><path d="m13.5 10.5 2.2-2.2a3.1 3.1 0 1 1 4.4 4.4l-2.2 2.2a3.1 3.1 0 0 1-4.4 0" /><path d="m9 15 6-6" /></StrokeIcon>; }
export function QueueIcon() { return <StrokeIcon><path d="M12 6v6l3.5 2" /><circle cx="12" cy="12" r="8" /></StrokeIcon>; }
export function CheckBadgeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 12.5 3 3 6-7" /><circle cx="12" cy="12" r="8" /></svg>; }
export function EmptyPostsIcon() { return <StrokeIcon><path d="M4 7.5h16" /><path d="M7.5 4v7" /><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12h8" /><path d="M8 16h5" /></StrokeIcon>; }

export function formatDate(value?: string | null) {
  if (!value) return "No schedule";
  try {
    return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return value;
  }
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    posted: "bg-[#eef8d8] text-[#4a6d16]",
    failed: "bg-[#fff1ef] text-[#b64e48]",
    cancelled: "bg-[#f0f0f0] text-[#666]",
  };
  const cls = map[status] ?? "bg-[#fff5d9] text-[#9c7620]";
  const dotCls = status === "posted" ? "bg-[#8dc63f]" : status === "failed" ? "bg-[#d86b60]" : "bg-[#efc84f]";
  return <span className={`status-pill ${cls}`}><span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />{status}</span>;
}
