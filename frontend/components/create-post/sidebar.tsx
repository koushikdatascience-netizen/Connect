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
    // ❌ removed h-full + overflow
    // ✅ let parent control scroll
    <div className="flex flex-col gap-5 p-3 min-h-0 flex-1">

      {/* ---------------- PLATFORMS ---------------- */}
      <div className="rounded-2xl border border-[#eadfcb] bg-white/80 backdrop-blur p-4 shadow-sm">

        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Platforms & Accounts
            </p>
            <p className="text-[12px] text-[#7a6f5c]">
              Select accounts to publish
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectAll(!allSelected)}
            disabled={totalAccounts === 0}
            className="
              rounded-full px-3 py-1 text-[10px] font-semibold
              bg-gradient-to-r from-[#1f170c] to-[#3a2b10]
              text-[#f6d48f] shadow-sm
              disabled:cursor-not-allowed disabled:opacity-40
            "
          >
            {allSelected ? "Clear" : "All"}
          </motion.button>
        </div>

        {totalAccounts === 0 ? (
          <div className="mb-4 rounded-2xl border border-[#eadfcb] bg-[#fff8e8] px-4 py-3">
            <p className="text-sm font-semibold text-[#2a2116]">
              Connect your social accounts first
            </p>
            <p className="mt-1 text-xs leading-5 text-[#7a6f5c]">
              Add at least one account before choosing YouTube, Instagram, Facebook, or any other publishing channel.
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
              onManageAccounts={onManageAccounts}
            />
          ))}
        </div>
      </div>

      {/* ---------------- ACCOUNT GROUPS ---------------- */}
      {accountGroups.length > 0 && (
        <div className="rounded-2xl border border-[#eadfcb] bg-white/80 backdrop-blur p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Account Groups
            </p>
            <span className="text-[10px] text-[#9d917d]">
              {accountGroups.length}
            </span>
          </div>

          <div className="space-y-2">
            {accountGroups.map((group) => (
              <motion.div
                key={group.id}
                whileHover={{ scale: 1.02 }}
                className="
                  group flex items-center justify-between rounded-xl
                  border border-[#eee3d0]
                  bg-white px-3 py-2
                  transition-all duration-200
                  hover:shadow-md
                "
              >
                <button
                  type="button"
                  onClick={() => onApplyGroup(group.id)}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-[#2a2116]">
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
                    opacity-0 transition-all duration-200
                    group-hover:opacity-100
                    hover:bg-red-50 hover:text-red-600
                  "
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- SAVE GROUP ---------------- */}
      <div className="rounded-2xl border border-[#eadfcb] bg-white/80 backdrop-blur p-4 shadow-sm">

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
          Save Group
        </p>

        <div className="flex gap-2">
          <input
          value={groupName}
          onChange={(event) => onGroupNameChange(event.target.value)}
          placeholder="Group name..."
          className="
          h-9 min-w-0 flex-1 rounded-md border border-[#eee3d0]
          bg-white/70 px-2 text-xs
          focus:ring-2 focus:ring-[#d4a94f]/40 focus:border-[#d4a94f]
    "
        />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={onSaveGroup}
            disabled={!groupName.trim()}
            className="
              rounded-md px-3 text-xs text-white
              bg-gradient-to-r from-black to-[#333]
              shadow-sm
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            Save
          </motion.button>
        </div>
      </div>
      {/* ---------------- NEXT BUTTON (MOBILE) ---------------- */}
        <div className="pt-2 md:hidden">
          <button
            onClick={() => {
              if (onContinueToCompose) {
                onContinueToCompose();
                return;
              }
              setMobileTab("compose");
            }}
            disabled={totalSelectedAccounts === 0}
            className={`w-full py-3 rounded-xl text-sm font-semibold ${
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
