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
  const allSelected =
    totalSelectedAccounts === totalAccounts && totalAccounts > 0;

  return (
    <div className="flex flex-col gap-4 p-2 h-full overflow-y-auto">

      {/* PLATFORMS */}
      <div className="rounded-2xl border border-[#eee3d0] bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">

        {/* HEADER */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Platforms & Accounts
            </p>
            <p className="text-[12px] text-[#6f6558]">
              Select accounts to publish
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectAll(!allSelected)}
            className="
              rounded-full px-3 py-1 text-[10px] font-semibold
              bg-gradient-to-r from-[#1f170c] to-[#3a2b10]
              text-[#f6d48f]
              transition-all duration-200
              hover:scale-105 hover:shadow-md
            "
          >
            {allSelected ? "Clear" : "All"}
          </button>
        </div>

        {/* PLATFORM LIST */}
        <div className="space-y-2">
          {platforms.map((platform) => (
            <PlatformSelector
              key={platform.id}
              platform={platform}
              onPlatformToggle={(enabled) =>
                onPlatformToggle(platform.id, enabled)
              }
              onSelectAllAccounts={(enabled) =>
                onSelectAllAccounts(platform.id, enabled)
              }
              onAccountToggle={(accountId, enabled) =>
                onAccountToggle(platform.id, accountId, enabled)
              }
            />
          ))}
        </div>
      </div>

      {/* ACCOUNT GROUPS */}
      {accountGroups.length > 0 && (
        <div className="rounded-2xl border border-[#eee3d0] bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">

          {/* HEADER */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Account Groups
            </p>
            <span className="text-[10px] text-[#9d917d]">
              {accountGroups.length}
            </span>
          </div>

          {/* GROUP LIST */}
          <div className="space-y-2">
            {accountGroups.map((group) => (
              <div
                key={group.id}
                className="
                  group flex items-center justify-between rounded-xl border
                  bg-[#fffdfa] px-3 py-2
                  transition-all duration-200
                  hover:shadow-[0_4px_14px_rgba(0,0,0,0.08)]
                  hover:scale-[1.01]
                "
              >
                <button
                  type="button"
                  onClick={() => onApplyGroup(group.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-[#241b10]">
                    {group.name}
                  </div>
                  <div className="text-[10px] text-[#9d917d]">
                    {group.accountIds.length} accounts
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveGroup(group.id)}
                  className="
                    ml-2 rounded-full p-1
                    text-[#9d917d]
                    transition-all duration-200
                    hover:bg-red-50 hover:text-red-600
                  "
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVE GROUP */}
      <div className="rounded-2xl border border-[#eee3d0] bg-white p-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)]">

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
          Save Group
        </p>

        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            placeholder="Group name..."
            className="
              h-9 flex-1 rounded-md border px-2 text-xs
              outline-none transition-all duration-200
              focus:ring-1 focus:ring-[#d1ac63]
            "
          />

          <button
            type="button"
            onClick={onSaveGroup}
            disabled={!groupName.trim()}
            className="
              rounded-md px-3 text-xs text-white
              bg-gradient-to-r from-black to-[#333]
              transition-all duration-200
              hover:scale-105 hover:shadow-md
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}