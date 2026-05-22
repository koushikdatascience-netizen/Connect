"use client";

import { useEffect, useState } from "react";

const COUNTDOWN_STORAGE_KEY = "snapkey_review_countdown_deadline";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getInitialDeadline() {
  if (typeof window === "undefined") return Date.now() + SEVEN_DAYS_MS;

  const existing = window.localStorage.getItem(COUNTDOWN_STORAGE_KEY);
  const parsed = existing ? Number(existing) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > Date.now()) return parsed;

  const nextDeadline = Date.now() + SEVEN_DAYS_MS;
  window.localStorage.setItem(COUNTDOWN_STORAGE_KEY, String(nextDeadline));
  return nextDeadline;
}

function formatRemaining(ms: number) {
  const safeMs = Math.max(0, ms);
  const days = Math.floor(safeMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((safeMs / (60 * 60 * 1000)) % 24);
  const minutes = Math.floor((safeMs / (60 * 1000)) % 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export function ReviewCountdownAlert() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setDeadline(getInitialDeadline());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!deadline) return null;

  return (
    <div className="rounded-2xl border border-[#e7c861] bg-[#fff7d8] px-4 py-3 text-sm text-[#6f5308] shadow-[0_12px_28px_rgba(146,108,14,0.10)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">Review access window</span>
        <span className="rounded-full bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#916b08]">
          {formatRemaining(deadline - now)} left
        </span>
      </div>
    </div>
  );
}
