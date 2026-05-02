"use client";

import { useEffect, useState } from "react";
import { PlatformLogo } from "@/components/platform-logo";
import { SidebarPlatform } from "@/components/create-post/types";

type Props = {
  platform: SidebarPlatform;
  onPlatformToggle: (enabled: boolean) => void;
  onSelectAllAccounts: (enabled: boolean) => void;
  onAccountToggle: (accountId: number, enabled: boolean) => void;
};

function AccountAvatar({ src, name }: { src?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  const showImage = !!src && !imgError;

  return showImage ? (
    <img
      src={src}
      alt={name}
      className="h-8 w-8 shrink-0 rounded-full border border-[#eadfcb] object-cover"
      onError={() => setImgError(true)}
    />
  ) : (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#eadfcb] bg-[#f6efe4] text-[10px] font-semibold text-[#6f6558]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function getEntityLabel(accountType?: string | null) {
  if (!accountType) return "Account";
  const t = accountType.toLowerCase();
  if (t.includes("page")) return "Page";
  if (t.includes("group")) return "Group";
  return "Account";
}

function compactAccountName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length <= 14) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return `${parts[0].slice(0, 8)} ${parts[1].slice(0, 4)}`.trim();
  }
  return `${trimmed.slice(0, 12)}…`;
}

export function PlatformSelector({
  platform,
  onPlatformToggle,
  onSelectAllAccounts,
  onAccountToggle,
}: Props) {
  const hasAccounts = platform.accounts.length > 0;
  const selectedCount = platform.selectedAccountIds.length;
  const allSelected = hasAccounts && selectedCount === platform.accounts.length;
  const [expanded, setExpanded] = useState(platform.selected);

  useEffect(() => {
    if (platform.selected) setExpanded(true);
  }, [platform.selected]);

  return (
    <div className="rounded-[20px] border border-[#ede2cf] bg-white/90 px-3 py-3 shadow-[0_10px_24px_rgba(36,24,6,0.04)]">
      {/* Platform row */}
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={platform.selected}
            disabled={!hasAccounts}
            onChange={(e) => onPlatformToggle(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#cdbd98] text-[#b8871a] focus:ring-[#ead39a] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        {/* Platform icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff8eb] ring-1 ring-[#eadfcb]">
          <PlatformLogo platform={platform.id} className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9b7b3f]">
              {hasAccounts ? `${platform.accounts.length} acc` : "0 acc"}
            </span>
            <span className="text-[9px] text-[#9d917d]">
              {platform.selected ? "live" : "idle"}
            </span>
          </div>
          {platform.selected && selectedCount > 0 && (
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#9b7b3f]">
              {selectedCount} selected
            </p>
          )}
        </div>

        {/* Expand toggle */}
        {hasAccounts && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#9d917d] hover:bg-[#faf3e5] hover:text-[#6f5316]"
          >
            <svg
              viewBox="0 0 16 16"
              className={`h-3.5 w-3.5 fill-current transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        )}
      </div>

      {/* Accounts list (collapsible) */}
      {hasAccounts && expanded && (
        <div className="ml-[22px] mt-3 border-l border-[#efe4d1] pl-4 space-y-1.5">
          {platform.accounts.length > 1 && (
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] text-[#9d917d]">{selectedCount}/{platform.accounts.length} selected</span>
              <button
                type="button"
                onClick={() => onSelectAllAccounts(!allSelected)}
                className="text-[10px] font-semibold text-[#9b7b3f] hover:text-[#6f5316]"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
          )}

          {platform.accounts.map((account) => {
            const checked = platform.selectedAccountIds.includes(account.id);
            return (
              <label
                key={account.id}
                className={`flex cursor-pointer items-center gap-2 rounded-[14px] border px-2 py-1.5 transition-colors ${
                  checked
                    ? "border-[#d9be87] bg-[#fff8e8]"
                    : "border-[#efe4d1] bg-[#fffdfa] hover:bg-[#fcf7ee]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onAccountToggle(account.id, e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[#cdbd98] text-[#b8871a] focus:ring-[#ead39a]"
                />
                <AccountAvatar src={account.profile_picture_url} name={account.account_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-medium text-[#241b10]">{compactAccountName(account.account_name)}</div>
                  <div className="text-[9px] uppercase tracking-[0.12em] text-[#9d917d]">{getEntityLabel(account.account_type)}</div>
                </div>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
