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
    <div className="flex flex-col gap-4 p-2 h-full overflow-y-auto">

      {/* PLATFORMS */}
      <div className="rounded-xl border border-[#eee3d0] bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-start justify-between">
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
            className="rounded-full bg-[#1f170c] px-3 py-1 text-[10px] font-semibold text-[#f6d48f] hover:bg-black"
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
        <div className="rounded-xl border border-[#eee3d0] bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Account Groups
            </p>
            <span className="text-[10px] text-[#9d917d]">
              {accountGroups.length}
            </span>
          </div>

          <div className="space-y-2">
            {accountGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-lg border bg-[#fffdfa] px-3 py-2 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onApplyGroup(group.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-medium text-[#241b10]">
                    {group.name}
                  </div>
                  <div className="text-[10px] text-[#9d917d]">
                    {group.accountIds.length} accounts
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveGroup(group.id)}
                  className="ml-2 rounded-full p-1 text-[#9d917d] hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVE GROUP */}
      <div className="rounded-xl border border-[#eee3d0] bg-white p-3 shadow-sm">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
          Save Group
        </p>

        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            placeholder="Group name..."
            className="h-9 flex-1 rounded-md border px-2 text-xs outline-none focus:ring-1 focus:ring-[#d1ac63]"
          />

          <button
            type="button"
            onClick={onSaveGroup}
            disabled={!groupName.trim()}
            className="rounded-md bg-black px-3 text-xs text-white disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}