"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformLogo } from "@/components/platform-logo";
import { SidebarPlatform } from "@/components/create-post/types";
import { PLATFORM_META } from "@/components/create-post/constants";

const platformStyles: Record<string, string> = {
  facebook: "from-[#1877F2]/16 to-[#1877F2]/5 border-[#1877F2]/25",
  instagram: "from-pink-500/16 via-purple-500/8 to-yellow-500/8 border-pink-400/25",
  linkedin: "from-[#0A66C2]/16 to-[#0A66C2]/5 border-[#0A66C2]/25",
  twitter: "from-black/8 to-black/5 border-black/15",
  youtube: "from-red-500/16 to-red-400/8 border-red-400/25",
  blogger: "from-orange-500/16 to-orange-400/8 border-orange-400/25",
  google_business: "from-green-500/16 to-green-400/8 border-green-400/25",
  wordpress: "from-sky-500/16 to-sky-400/8 border-sky-400/25",
};

type Props = {
  platform: SidebarPlatform;
  onPlatformToggle: (enabled: boolean) => void;
  onSelectAllAccounts: (enabled: boolean) => void;
  onAccountToggle: (accountId: number, enabled: boolean) => void;
  onManageAccounts: () => void;
};

export function PlatformSelector({
  platform,
  onPlatformToggle,
  onSelectAllAccounts,
  onAccountToggle,
  onManageAccounts,
}: Props) {
  const hasAccounts = platform.accounts.length > 0;
  const selectedCount = platform.selectedAccountIds.length;
  const allSelected =
    hasAccounts && selectedCount === platform.accounts.length;

  const [expanded, setExpanded] = useState(platform.selected);

  useEffect(() => {
    if (platform.selected) {
      setExpanded(true);
    }
  }, [platform.selected]);

  const style = platformStyles[platform.id] || "";
  const platformLabel = PLATFORM_META[platform.id]?.label ?? platform.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl transition-all duration-200"
    >
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => hasAccounts && onPlatformToggle(!platform.selected)}
        className={`relative flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-all duration-200 ${
          platform.selected
            ? `bg-gradient-to-r ${style} shadow-sm`
            : hasAccounts
              ? "cursor-pointer border-[#eee3d0] bg-white/70 hover:bg-white"
              : "cursor-not-allowed border-[#eee3d0] bg-[#f8f5ef] opacity-85"
        }`}
      >
        {platform.selected ? (
          <div className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#d4a94f] to-[#b8923a]" />
        ) : null}

        <input
          type="checkbox"
          checked={platform.selected}
          disabled={!hasAccounts}
          onChange={(event) => {
            if (hasAccounts) {
              onPlatformToggle(event.target.checked);
            }
          }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`Select ${platformLabel}`}
          className="h-3.5 w-3.5 shrink-0 accent-[#d4a94f] disabled:cursor-not-allowed"
        />

        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white shadow-sm">
          <PlatformLogo platform={platform.id} className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-[#2a2116]">
            {platformLabel}
          </div>
          {!hasAccounts ? (
            <div className="truncate text-[9px] font-medium leading-3 text-[#9d6b2f]">
              No account connected
            </div>
          ) : null}
        </div>

        {selectedCount > 0 ? (
          <span className="rounded-full bg-black/5 px-2 py-[2px] text-[10px] font-semibold text-[#5f513b]">
            {selectedCount}
          </span>
        ) : null}

        {hasAccounts ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExpanded((value) => !value);
            }}
            aria-label={expanded ? `Collapse ${platformLabel}` : `Expand ${platformLabel}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-gray-500 transition-colors hover:bg-black/5 hover:text-black"
          >
            {expanded ? "-" : "+"}
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onManageAccounts();
            }}
            className="shrink-0 rounded-md border border-[#d4a94f]/35 bg-white px-2 py-1 text-[9px] font-semibold text-[#7a5716] transition-colors hover:bg-[#fff3ce]"
          >
            Connect
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {expanded && hasAccounts ? (
          <motion.div
            key="accounts"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 space-y-1 rounded-lg border border-[#f0e6d5] bg-[#fffdf8] px-1.5 py-1.5">
              {platform.accounts.length > 1 ? (
                <div className="flex justify-between px-1 text-[10px] font-medium text-[#9d917d]">
                  <span>
                    {selectedCount}/{platform.accounts.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectAllAccounts(!allSelected)}
                    className="font-semibold text-[#8a6a18] hover:text-black"
                  >
                    {allSelected ? "Clear" : "All"}
                  </button>
                </div>
              ) : null}

              {platform.accounts.map((account) => {
                const checked = platform.selectedAccountIds.includes(account.id);

                return (
                  <motion.label
                    key={account.id}
                    layout
                    whileHover={{ x: 1 }}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 transition-all duration-200 ${
                      checked
                        ? "border-[#d4a94f]/35 bg-[#fff9ef] shadow-sm"
                        : "border-transparent hover:border-[#eee3d0] hover:bg-[#f7f3ec]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        onAccountToggle(account.id, event.target.checked)
                      }
                      className="h-3 w-3 shrink-0 accent-[#d4a94f]"
                    />

                    {account.profile_picture_url ? (
                      <img
                        src={account.profile_picture_url}
                        alt={account.account_name}
                        className="h-[18px] w-[18px] flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full bg-[#e8dfc8] text-[9px] font-semibold text-[#9b7b3f]"
                      >
                        {account.account_name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <span className="truncate text-xs font-medium text-[#2a2116]">
                      {account.account_name}
                    </span>
                  </motion.label>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
