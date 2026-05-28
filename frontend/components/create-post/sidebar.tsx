"use client";

import { motion } from "framer-motion";
import {
  SavedAccountGroup,
  SidebarPlatform,
} from "@/components/create-post/types";
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
  onPlatformToggle: (
    platformId: SidebarPlatform["id"],
    enabled: boolean
  ) => void;
  onSelectAllAccounts: (
    platformId: SidebarPlatform["id"],
    enabled: boolean
  ) => void;
  onAccountToggle: (
    platformId: SidebarPlatform["id"],
    accountId: number,
    enabled: boolean
  ) => void;
  setMobileTab: (tab: "accounts" | "compose" | "settings") => void;
  onContinueToCompose?: () => void;
  onManageAccounts: () => void;
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
  setMobileTab,
  onContinueToCompose,
  onManageAccounts,
}: Props) {
  const allSelected =
    totalSelectedAccounts === totalAccounts && totalAccounts > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div className="rounded-2xl border border-[#eadfcb] bg-white/85 p-3 shadow-sm backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
            Account Groups
          </p>
          {accountGroups.length > 0 ? (
            <span className="rounded-full bg-[#fff3d7] px-2 py-0.5 text-[10px] font-semibold text-[#8a6a18]">
              {accountGroups.length}
            </span>
          ) : null}
        </div>

        {accountGroups.length > 0 ? (
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {accountGroups.map((group) => (
              <motion.div
                key={group.id}
                whileHover={{ y: -1 }}
                className="inline-flex shrink-0 items-center overflow-hidden rounded-full border border-[#eee3d0] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onApplyGroup(group.id)}
                  className="min-w-0 px-3 py-1.5 text-left"
                >
                  <span className="block max-w-[130px] truncate text-xs font-semibold text-[#2a2116]">
                    {group.name}
                  </span>
                  <span className="block text-[10px] leading-none text-[#9d917d]">
                    {group.accountIds.length} accounts
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveGroup(group.id)}
                  className="h-full px-2 text-xs text-[#9d917d] transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove ${group.name}`}
                >
                  x
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="mb-3 text-xs leading-5 text-[#7a6f5c]">
            Save frequent account sets here for faster publishing.
          </p>
        )}

        <div className="flex gap-2">
          <input
            value={groupName}
            onChange={(event) => onGroupNameChange(event.target.value)}
            placeholder="New group name"
            className="h-9 min-w-0 flex-1 rounded-xl border border-[#eee3d0] bg-white/80 px-3 text-xs text-[#2a2116] focus:border-[#d4a94f] focus:ring-2 focus:ring-[#d4a94f]/30"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onSaveGroup}
            disabled={!groupName.trim()}
            className="rounded-xl bg-[#212121] px-3 text-xs font-semibold uppercase text-white shadow-sm transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </motion.button>
        </div>
      </div>

      <div className="rounded-2xl border border-[#eadfcb] bg-white/80 p-3 shadow-sm backdrop-blur">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Platforms & Accounts
            </p>
            <p className="text-[12px] text-[#7a6f5c]">
              Select accounts to publish
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectAll(!allSelected)}
            disabled={totalAccounts === 0}
            className="rounded-full bg-gradient-to-r from-[#1f170c] to-[#3a2b10] px-3 py-1 text-[10px] font-semibold text-[#f6d48f] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {allSelected ? "Clear" : "All"}
          </motion.button>
        </div>

        {totalAccounts === 0 ? (
          <div className="mb-3 rounded-2xl border border-[#eadfcb] bg-[#fff8e8] px-4 py-3">
            <p className="text-sm font-semibold text-[#2a2116]">
              Connect your social accounts first
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7a6f5c]">
              Add at least one account before choosing a publishing channel.
            </p>
            <button
              type="button"
              onClick={onManageAccounts}
              className="mt-3 w-full rounded-xl bg-[#212121] px-4 py-2.5 text-xs font-semibold uppercase text-white transition-colors hover:bg-[#333]"
            >
              Manage Accounts
            </button>
          </div>
        ) : null}

        <div className="space-y-1.5">
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
              onManageAccounts={onManageAccounts}
            />
          ))}
        </div>
      </div>

      <div className="pt-1 md:hidden">
        <button
          type="button"
          onClick={() => {
            if (onContinueToCompose) {
              onContinueToCompose();
              return;
            }
            setMobileTab("compose");
          }}
          disabled={totalSelectedAccounts === 0}
          className={`w-full rounded-xl py-3 text-sm font-semibold ${
            totalSelectedAccounts === 0
              ? "bg-gray-300 text-gray-500"
              : "bg-gradient-to-r from-[#1f170c] to-[#3a2b10] text-[#f6d48f]"
          }`}
        >
          {totalAccounts === 0 ? "Connect accounts first" : "Next"}
        </button>
      </div>
    </div>
  );
}
