"use client";

import { PlatformLogo } from "@/components/platform-logo";
import { SidebarPlatform } from "@/components/create-post/types";

type Props = {
  platform: SidebarPlatform;
  onPlatformToggle: (enabled: boolean) => void;
  onAccountToggle: (accountId: number, enabled: boolean) => void;
};

function formatAccountType(accountType?: string | null) {
  if (!accountType) return "Connected account";
  return accountType.replace(/_/g, " ");
}

export function PlatformSelector({
  platform,
  onPlatformToggle,
  onAccountToggle,
}: Props) {
  const hasAccounts = platform.accounts.length > 0;

  return (
    <section
      className={`mb-2 rounded-[10px] border p-3 transition-all duration-200 ${
        platform.selected
          ? "border-[rgba(245,200,0,0.55)] bg-[#1a1a1a] shadow-[0_0_0_1px_rgba(245,200,0,0.18)]"
          : "border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] hover:bg-[rgba(255,255,255,0.04)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <label className="mt-0.5 inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={platform.selected}
            disabled={!hasAccounts}
            onChange={(event) => onPlatformToggle(event.target.checked)}
            className="h-4 w-4 rounded-[4px] border-[1.5px] border-[rgba(255,255,255,0.2)] bg-transparent text-[#F5C800] focus:ring-0"
          />
        </label>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] ${platform.id === "twitter" ? "bg-black text-white" : ""} ${platform.id === "youtube" ? "bg-[#FF0000] text-white" : ""} ${platform.id === "blogger" ? "bg-[#FF5722] text-white" : ""} ${!["twitter","youtube","blogger"].includes(platform.id) ? `bg-gradient-to-br ${platform.surfaceClass} ${platform.accentClass}` : ""}`}
        >
          <PlatformLogo platform={platform.id} className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-[rgba(255,255,255,0.35)]">Platform</p>
              <h3 className="mt-0.5 text-[12px] font-medium text-white">{platform.label}</h3>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-[#E24B4A]">
                <span className="h-[5px] w-[5px] rounded-full bg-[#E24B4A]" />
                <span>{hasAccounts ? "Connected" : "Unavailable"}</span>
              </div>
            </div>
            <span
              className={`rounded-md px-2 py-1 text-[10px] ${
                hasAccounts
                  ? "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.35)]"
                  : "bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.3)]"
              }`}
            >
              {hasAccounts ? `${platform.accounts.length} account${platform.accounts.length > 1 ? "s" : ""}` : "Not connected"}
            </span>
          </div>

          <div
            className={`grid transition-all duration-300 ${
              platform.selected && hasAccounts ? "grid-rows-[1fr] pt-4" : "grid-rows-[0fr] pt-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-2 border-t border-[rgba(255,255,255,0.08)] pt-4">
                {platform.accounts.map((account) => {
                  const checked = platform.selectedAccountIds.includes(account.id);
                  return (
                    <label
                      key={account.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-3 transition-all duration-200 ${
                        checked
                          ? "border-[rgba(245,200,0,0.45)] bg-[rgba(255,255,255,0.04)]"
                          : "border-[rgba(255,255,255,0.08)] bg-[#0d0d0d] hover:bg-[rgba(255,255,255,0.04)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => onAccountToggle(account.id, event.target.checked)}
                        className="mt-1 h-4 w-4 rounded-[4px] border-[1.5px] border-[rgba(255,255,255,0.2)] bg-transparent text-[#F5C800] focus:ring-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-white">
                          {account.account_name}
                        </div>
                        <div className="mt-1 text-[10px] text-[rgba(255,255,255,0.35)]">
                          {formatAccountType(account.account_type)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {!hasAccounts ? (
            <p className="mt-4 text-xs text-[#6f798a]">
              Connect a {platform.label} account to enable publishing here.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
