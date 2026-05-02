"use client";

import { SavedAccountGroup, SidebarPlatform } from "@/components/create-post/types";
import { PlatformSelector } from "@/components/create-post/platform-selector";

type Props = {
  platforms: SidebarPlatform[];
  totalSelectedAccounts: number;
  totalAccounts: number;
  groupName: string;
  accountGroups: SavedAccountGroup[];
  onGroupNameChange: (value: string) => void;
  onSaveGroup: () => void;
  onApplyGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onSelectAll: (enabled: boolean) => void;
  onPlatformToggle: (platformId: SidebarPlatform["id"], enabled: boolean) => void;
  onSelectAllAccounts: (platformId: SidebarPlatform["id"], enabled: boolean) => void;
  onAccountToggle: (
    platformId: SidebarPlatform["id"],
    accountId: number,
    enabled: boolean,
  ) => void;
};

export function Sidebar({
  platforms,
  totalSelectedAccounts,
  totalAccounts,
  groupName,
  accountGroups,
  onGroupNameChange,
  onSaveGroup,
  onApplyGroup,
  onRemoveGroup,
  onSelectAll,
  onPlatformToggle,
  onSelectAllAccounts,
  onAccountToggle,
}: Props) {
  const allSelected = totalSelectedAccounts === totalAccounts && totalAccounts > 0;

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="rounded-[28px] border border-[#eadfcb] bg-white p-5 shadow-[0_18px_50px_rgba(36,24,6,0.05)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">
              Platforms & Accounts
            </p>
            <p className="mt-2 text-sm text-[#6f6558]">
              Select accounts to publish your post.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className="rounded-full border border-[#e5d7be] bg-[#fff9ef] px-3 py-1.5 text-[11px] font-semibold text-[#7a5c1f] hover:bg-[#fff1cf]"
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
        </div>
        <div className="space-y-3">
        {platforms.map((platform) => (
          <PlatformSelector
            key={platform.id}
            platform={platform}
            onPlatformToggle={(enabled) => onPlatformToggle(platform.id, enabled)}
            onSelectAllAccounts={(enabled) => onSelectAllAccounts(platform.id, enabled)}
            onAccountToggle={(accountId, enabled) =>
              onAccountToggle(platform.id, accountId, enabled)
            }
          />
        ))}
        </div>
      </div>

      {accountGroups.length > 0 && (
        <div className="rounded-[28px] border border-[#eadfcb] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(36,24,6,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">Account Groups</p>
            <span className="text-[11px] text-[#9d917d]">{accountGroups.length} saved</span>
          </div>
          <div className="space-y-1.5">
            {accountGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-[18px] border border-[#ede2cf] bg-[#fffdfa] px-3 py-3"
              >
                <button
                  type="button"
                  onClick={() => onApplyGroup(group.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-medium text-[#241b10]">{group.name}</div>
                  <div className="text-[10px] text-[#9d917d]">{group.accountIds.length} accounts</div>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveGroup(group.id)}
                  className="ml-2 rounded-full p-1 text-[#9d917d] hover:bg-[#f8ede7] hover:text-[#b44d2b]"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[28px] border border-[#eadfcb] bg-white px-5 py-5 shadow-[0_18px_50px_rgba(36,24,6,0.05)]">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">Save as Group</p>
        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            placeholder="Group name..."
            className="h-11 flex-1 rounded-[16px] border border-[#e7dcc9] bg-[#fffdfa] px-3 text-xs text-[#241b10] outline-none placeholder:text-[#b3a99d] focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb]"
          />
          <button
            type="button"
            onClick={onSaveGroup}
            className="h-11 rounded-[16px] bg-[#1f170c] px-4 text-xs font-semibold text-[#f6d48f] hover:bg-[#130d05]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
