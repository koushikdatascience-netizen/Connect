"use client";

import { ReactNode } from "react";

import { PlatformLogo } from "@/components/platform-logo";
import { PLATFORM_LABELS } from "@/components/create-post/constants";
import {
  PlatformConfigMap,
  SelectedAccountsMap,
} from "@/components/create-post/types";
import { Account, PlatformName } from "@/lib/types";

/* ================= TYPES ================= */

type Props = {
  selectedPlatforms: PlatformName[];
  selectedAccounts: SelectedAccountsMap;
  platformConfigs: PlatformConfigMap;
  accountsByPlatform: Record<PlatformName, Account[]>;
  expandedPlatforms: Record<string, boolean>;
  activePlatformTab: PlatformName | null;
  onTabChange: (platform: PlatformName) => void;
  onToggleExpand: (platform: PlatformName) => void;
  onConfigChange: (
    platform: PlatformName,
    key: keyof PlatformConfigMap[PlatformName],
    value: any
  ) => void;
};

/* ================= UI ================= */

const inputCls =
  "w-full rounded-[16px] border border-[#e7dcc9] bg-[#fffdfa] px-3 py-2.5 text-sm text-[#241b10] outline-none focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb]";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[#6f6558]">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-[#9d917d]">{hint}</p>}
    </div>
  );
}

/* ================= DATE FIX ================= */

function formatDateTimeLocal(value?: string) {
  if (!value) return "";

  try {
    const date = new Date(value);

    const pad = (n: number) => n.toString().padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
}

/* ================= MAIN ================= */

export function PlatformSettings({
  selectedPlatforms,
  platformConfigs,
  activePlatformTab,
  onTabChange,
  onConfigChange,
}: Props) {
  if (!selectedPlatforms.length) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        Select a platform
      </div>
    );
  }

  const activeTab = activePlatformTab ?? selectedPlatforms[0];
  const config = platformConfigs[activeTab];

  const handleSchedule = () => {
    console.log("Final Config:", platformConfigs);

    // future: send to backend
    // const isoDate = new Date(config.schedule).toISOString();
  };

  return (
    <div className="flex flex-col h-full">

      {/* TABS */}
      <div className="border-b border-[#eadfcb] bg-white px-4 pt-4">
        <div className="flex gap-1 overflow-x-auto">
          {selectedPlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => onTabChange(platform)}
              className={`flex items-center gap-2 px-3 py-2 text-xs rounded-t-lg border-b-2 transition
                ${
                  activeTab === platform
                    ? "border-[#b8871a] text-[#7a5c1f] bg-[#fff7e6]"
                    : "border-transparent text-[#8d8274] hover:bg-[#faf6ef]"
                }`}
            >
              <PlatformLogo platform={platform} className="h-4 w-4" />
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5">

        <div className="flex items-center gap-2 mb-4">
          <PlatformLogo platform={activeTab} className="h-5 w-5" />
          <h3 className="text-sm font-semibold text-[#1f170c]">
            {PLATFORM_LABELS[activeTab]} post settings
          </h3>
        </div>

        {/* SCHEDULE FIXED */}
        <Field label="Schedule" hint="Leave blank to publish immediately.">
          <input
            type="datetime-local"
            value={formatDateTimeLocal(config.schedule)}
            onChange={(e) =>
              onConfigChange(activeTab, "schedule", e.target.value)
            }
            className={inputCls}
          />
        </Field>

      </div>

      {/* FOOTER BUTTON */}
      <div className="border-t border-[#eadfcb] p-4">
        <button
          type="button"
          onClick={handleSchedule}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-[#decdaa] bg-white px-4 py-2.5 text-sm font-medium text-[#4b3f2f] transition hover:bg-[#fcf7ee]"
        >
          Schedule for later
        </button>
      </div>
    </div>
  );
}