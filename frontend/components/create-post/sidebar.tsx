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
    <div className="flex flex-col gap-3 p-1">

      {/* PLATFORMS */}
      <div className="rounded-md border border-[#eee3d0] bg-transparent p-2">
        <div className="mb-2 flex items-start justify-between gap-1">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">
              Platforms & Accounts
            </p>
            <p className="mt-1 text-[12px] text-[#6f6558]">
              Pick connected accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className="shrink-0 rounded-full border border-[#e5d7be] bg-[#fff9ef] px-2.5 py-1 text-[10px] font-semibold text-[#7a5c1f] hover:bg-[#fff1cf]"
          >
            {allSelected ? "Clear" : "All"}
          </button>
        </div>

        <div className="space-y-1">
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

      {/* ACCOUNT GROUPS */}
      {accountGroups.length > 0 && (
        <div className="rounded-md border border-[#eee3d0] bg-transparent p-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">
              Account Groups
            </p>
            <span className="text-[10px] text-[#9d917d]">
              {accountGroups.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {accountGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-md border border-[#ede2cf] bg-[#fffdfa] px-2 py-2"
              >
                <button
                  type="button"
                  onClick={() => onApplyGroup(group.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-[11px] font-medium text-[#241b10]">
                    {group.name}
                  </div>
                  <div className="text-[9px] text-[#9d917d]">
                    {group.accountIds.length} accounts
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveGroup(group.id)}
                  className="ml-1 rounded-full p-1 text-[#9d917d] hover:bg-[#f8ede7] hover:text-[#b44d2b]"
                >
                  <svg viewBox="0 0 16 16" className="h-3 w-3 fill-current">
                    <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVE GROUP */}
      <div className="rounded-md border border-[#eee3d0] bg-transparent p-2">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">
          Save as Group
        </p>

        <div className="flex items-center gap-2">
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            placeholder="Group name..."
            className="h-10 w-full min-w-0 flex-1 rounded-md border border-[#e7dcc9] bg-[#fffdfa] px-2 text-[11px] text-[#241b10] outline-none placeholder:text-[#b3a99d] focus:border-[#d1ac63] focus:ring-1 focus:ring-[#f7ebcb]"
          />

          <button
            type="button"
            onClick={onSaveGroup}
            disabled={!groupName.trim()}
            className="h-10 shrink-0 whitespace-nowrap rounded-md bg-[#1f170c] px-3 text-[11px] font-semibold text-[#f6d48f] hover:bg-[#130d05] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}