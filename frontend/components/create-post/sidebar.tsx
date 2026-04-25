"use client";

import { SavedAccountGroup, SidebarPlatform } from "@/components/create-post/types";
import { PlatformSelector } from "@/components/create-post/platform-selector";

type Props = {
  platforms: SidebarPlatform[];
  totalSelectedAccounts: number;
  groupName: string;
  accountGroups: SavedAccountGroup[];
  onGroupNameChange: (value: string) => void;
  onSaveGroup: () => void;
  onApplyGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onPlatformToggle: (platformId: SidebarPlatform["id"], enabled: boolean) => void;
  onAccountToggle: (
    platformId: SidebarPlatform["id"],
    accountId: number,
    enabled: boolean,
  ) => void;
};

export function Sidebar({
  platforms,
  totalSelectedAccounts,
  groupName,
  accountGroups,
  onGroupNameChange,
  onSaveGroup,
  onApplyGroup,
  onRemoveGroup,
  onPlatformToggle,
  onAccountToggle,
}: Props) {
  const selectedCount = platforms.filter((platform) => platform.selected).length;

  return (
    <aside className="h-full bg-[#0d0d0d] xl:sticky xl:top-6">
      <div className="h-full flex flex-col">
        <div className="border-b border-[rgba(255,255,255,0.08)] px-4 py-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[rgba(255,255,255,0.4)]">
            Distribution
          </p>
          <h2 className="mt-2 text-[14px] font-medium text-white">
            Platforms & accounts
          </h2>
          <p className="mt-2 mb-3.5 text-[11px] leading-[1.5] text-[rgba(255,255,255,0.45)]">
            Choose channels, pages, and saved account groups from one focused panel.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[11px] text-[rgba(255,255,255,0.45)]">
              {selectedCount} platform{selectedCount === 1 ? "" : "s"} active
            </span>
            <span className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[11px] text-[rgba(255,255,255,0.45)]">
              {totalSelectedAccounts} account{totalSelectedAccounts === 1 ? "" : "s"} selected
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <section className="mb-4 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-[12px] font-medium text-white">Account groups</h3>
                <p className="mt-1 text-[10px] leading-[1.5] text-[rgba(255,255,255,0.35)]">
                  Save common account combinations and apply them in one click.
                </p>
              </div>
              <span className="rounded-md border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[11px] text-[rgba(255,255,255,0.45)] shrink-0">
                {accountGroups.length} saved
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <input
                  value={groupName}
                  onChange={(event) => onGroupNameChange(event.target.value)}
                  placeholder="Group name"
                  className="h-10 flex-1 min-w-0 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0d0d0d] px-3 text-[12px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)] focus:border-[#F5C800]"
                />
                <button
                  type="button"
                  onClick={onSaveGroup}
                  className="h-10 shrink-0 rounded-[10px] bg-[#F5C800] px-4 text-[12px] font-medium text-[#111111] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E6BE3A]"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {accountGroups.length ? (
                accountGroups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center gap-2 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0d0d0d] p-2"
                  >
                    <button
                      type="button"
                      onClick={() => onApplyGroup(group.id)}
                      className="flex-1 rounded-lg px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]"
                    >
                      <div className="text-[12px] font-medium text-white">{group.name}</div>
                      <div className="mt-1 text-[10px] text-[rgba(255,255,255,0.35)]">
                        {group.accountIds.length} account{group.accountIds.length === 1 ? "" : "s"}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveGroup(group.id)}
                      className="h-9 rounded-lg border border-[rgba(255,255,255,0.15)] bg-transparent px-3 text-[11px] text-[rgba(255,255,255,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-[10px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[#0d0d0d] px-3 py-4 text-[10px] leading-[1.5] text-[rgba(255,255,255,0.35)]">
                  No saved groups yet. Select accounts below, then save the current selection here.
                </div>
              )}
            </div>
          </section>

          <div className="space-y-3">
          {platforms.map((platform) => (
            <PlatformSelector
              key={platform.id}
              platform={platform}
              onPlatformToggle={(enabled) => onPlatformToggle(platform.id, enabled)}
              onAccountToggle={(accountId, enabled) =>
                onAccountToggle(platform.id, accountId, enabled)
              }
            />
          ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
