"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformLogo } from "@/components/platform-logo";
import { SidebarPlatform } from "@/components/create-post/types";

/* 🎨 PLATFORM STYLES */
const platformStyles: Record<string, string> = {
  facebook: "from-[#1877F2]/20 to-[#1877F2]/5 border-[#1877F2]/30",
  instagram:
    "from-pink-500/20 via-purple-500/10 to-yellow-500/10 border-pink-400/30",
  linkedin: "from-[#0A66C2]/20 to-[#0A66C2]/5 border-[#0A66C2]/30",
  twitter: "from-black/10 to-black/5 border-black/20",
  youtube: "from-red-500/20 to-red-400/10 border-red-400/30",
  blogger: "from-orange-500/20 to-orange-400/10 border-orange-400/30",
  google_business: "from-green-500/20 to-green-400/10 border-green-400/30",
  wordpress: "from-sky-500/20 to-sky-400/10 border-sky-400/30",
};

type Props = {
  platform: SidebarPlatform;
  onPlatformToggle: (enabled: boolean) => void;
  onSelectAllAccounts: (enabled: boolean) => void;
  onAccountToggle: (accountId: number, enabled: boolean) => void;
};

export function PlatformSelector({
  platform,
  onPlatformToggle,
  onSelectAllAccounts,
  onAccountToggle,
}: Props) {
  const hasAccounts = platform.accounts.length > 0;

  const selectedCount = platform.selectedAccountIds.length;
  const allSelected =
    hasAccounts && selectedCount === platform.accounts.length;

  const [expanded, setExpanded] = useState(platform.selected);

  useEffect(() => {
    if (platform.selected) setExpanded(true);
  }, [platform.selected]);

  const style = platformStyles[platform.id] || "";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl transition-all duration-200"
    >
      {/* PLATFORM ROW */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => hasAccounts && onPlatformToggle(!platform.selected)}
        className={`
          relative flex items-center gap-3 cursor-pointer
          rounded-xl border p-3 transition-all duration-200
          ${
            platform.selected
              ? `bg-gradient-to-r ${style} shadow-md`
              : "bg-white/60 hover:bg-white/90 border-[#eee3d0]"
          }
        `}
      >
        {/* LEFT ACTIVE BAR */}
        {platform.selected && (
          <div className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#d4a94f] to-[#b8923a] rounded-l-md" />
        )}

        {/* CHECKBOX */}
        <input
          type="checkbox"
          checked={platform.selected}
          onChange={(e) => onPlatformToggle(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 accent-[#d4a94f]"
        />

        {/* ICON */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
          <PlatformLogo platform={platform.id} className="h-4 w-4" />
        </div>

        {/* NAME */}
        <div className="flex-1 text-sm font-medium capitalize text-[#2a2116]">
          {platform.id}
        </div>

        {/* COUNT */}
        {selectedCount > 0 && (
          <span className="rounded-full bg-black/5 px-2 py-[2px] text-[10px]">
            {selectedCount}
          </span>
        )}

        {/* EXPAND */}
        {hasAccounts && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="text-xs text-gray-500 hover:text-black"
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </motion.div>

      {/* ACCOUNTS LIST */}
      <AnimatePresence>
        {expanded && hasAccounts && (
          <motion.div
            key="accounts"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 px-2 pb-2">

              {/* SELECT ALL */}
              {platform.accounts.length > 1 && (
                <div className="flex justify-between px-1 text-[10px] text-gray-400">
                  <span>
                    {selectedCount}/{platform.accounts.length}
                  </span>
                  <button
                    onClick={() => onSelectAllAccounts(!allSelected)}
                    className="hover:text-black"
                  >
                    {allSelected ? "Clear" : "All"}
                  </button>
                </div>
              )}

              {/* ACCOUNTS */}
              {platform.accounts.map((acc) => {
                const checked =
                  platform.selectedAccountIds.includes(acc.id);

                return (
                  <motion.label
                    key={acc.id}
                    layout
                    whileHover={{ scale: 1.02 }}
                    className={`
                      flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2
                      transition-all duration-200
                      ${
                        checked
                          ? "bg-[#fff9ef] border border-[#d4a94f]/30 shadow-sm"
                          : "hover:bg-[#f7f3ec]"
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        onAccountToggle(acc.id, e.target.checked)
                      }
                      className="h-3.5 w-3.5 accent-[#d4a94f]"
                    />

                    <img
                      src={acc.profile_picture_url || ""}
                      className="h-6 w-6 rounded-full object-cover"
                    />

                    <span className="text-xs truncate text-[#2a2116]">
                      {acc.account_name}
                    </span>
                  </motion.label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}