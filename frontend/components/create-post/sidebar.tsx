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
    // ❌ removed h-full + overflow
    // ✅ let parent control scroll
    <div className="flex flex-col gap-5 p-3 min-h-0">

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
            className="
              rounded-full px-3 py-1 text-[10px] font-semibold
              bg-gradient-to-r from-[#1f170c] to-[#3a2b10]
              text-[#f6d48f] shadow-sm
            "
          >
            {allSelected ? "Clear" : "All"}
          </motion.button>
        </div>

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
              h-9 flex-1 rounded-md border border-[#eee3d0]
              bg-white/70 px-2 text-xs
              outline-none transition-all duration-200
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
    </div>
  );
}