"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlatformLogo } from "@/components/platform-logo";
import { SidebarPlatform } from "@/components/create-post/types";

/* 🎨 PLATFORM STYLES */
const platformStyles: Record<string, string> = {
  facebook: "bg-[#1877F2]/10 border-[#1877F2]/30",
  instagram:
    "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-yellow-500/10 border-pink-400/30",
  linkedin: "bg-[#0A66C2]/10 border-[#0A66C2]/30",
  twitter: "bg-black/5 border-black/20",
  youtube: "bg-red-500/10 border-red-400/30",
  blogger: "bg-orange-500/10 border-orange-400/30",
  google_business: "bg-green-500/10 border-green-400/30",
  wordpress: "bg-sky-500/10 border-sky-400/30",
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
      className={`rounded-xl border transition-all duration-200 ${
        platform.selected
          ? `${style} shadow-sm`
          : "border-transparent hover:bg-black/5"
      }`}
    >
      {/* PLATFORM ROW */}
      <div className="flex items-center gap-2 px-2 py-2">
        <input
          type="checkbox"
          checked={platform.selected}
          disabled={!hasAccounts}
          onChange={(e) => onPlatformToggle(e.target.checked)}
          className="h-4 w-4 accent-black"
        />

        {/* ICON */}
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-sm">
          <PlatformLogo platform={platform.id} className="h-4 w-4" />
        </div>

        <div className="flex-1 text-sm font-medium capitalize">
          {platform.id}
        </div>

        {selectedCount > 0 && (
          <span className="text-[10px] text-gray-500">
            {selectedCount}
          </span>
        )}

        {hasAccounts && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-500 hover:text-black"
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </div>

      {/* ACCOUNTS LIST */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="accounts"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 px-3 pb-2">

              {/* SELECT ALL */}
              {platform.accounts.length > 1 && (
                <div className="flex justify-between text-[10px] text-gray-400">
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
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition ${
                      checked
                        ? "bg-black/10"
                        : "hover:bg-black/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        onAccountToggle(acc.id, e.target.checked)
                      }
                      className="h-3.5 w-3.5"
                    />

                    <img
                      src={acc.profile_picture_url || ""}
                      className="h-5 w-5 rounded-full object-cover"
                    />

                    <span className="text-xs truncate">
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