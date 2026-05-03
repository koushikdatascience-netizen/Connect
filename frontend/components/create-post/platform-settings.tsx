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
  "w-full rounded-[14px] border border-[#e7dcc9] bg-[#fffdfa] px-3 py-2 text-sm outline-none focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb]";

const selectCls = inputCls;

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[#6f6558]">{label}</label>
      {children}
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

  const handleSchedule = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(platformConfigs),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Scheduled successfully");
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error");
    }
  };

  return (
    <div className="flex flex-col h-full">

      {/* TABS */}
      <div className="border-b border-[#eadfcb] bg-white px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto">
          {selectedPlatforms.map((platform) => (
            <button
              key={platform}
              onClick={() => onTabChange(platform)}
              className={`flex items-center gap-2 px-3 py-2 text-xs rounded-t-md border-b-2
                ${
                  activeTab === platform
                    ? "border-[#b8871a] text-[#7a5c1f] bg-[#fff7e6]"
                    : "border-transparent text-[#8d8274]"
                }`}
            >
              <PlatformLogo platform={platform} className="h-4 w-4" />
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        <div className="flex items-center gap-2">
          <PlatformLogo platform={activeTab} className="h-5 w-5" />
          <h3 className="text-sm font-semibold">
            {PLATFORM_LABELS[activeTab]} settings
          </h3>
        </div>

        {/* SCHEDULE */}
        <Field label="Schedule">
          <input
            type="datetime-local"
            value={formatDateTimeLocal(config.schedule)}
            onChange={(e) =>
              onConfigChange(activeTab, "schedule", e.target.value)
            }
            className={inputCls}
          />
        </Field>

        {/* FACEBOOK */}
        {activeTab === "facebook" && (
          <>
            <Field label="Page ID">
              <input
                value={config.facebookPageId}
                onChange={(e) =>
                  onConfigChange(activeTab, "facebookPageId", e.target.value)
                }
                className={inputCls}
              />
            </Field>

            <Field label="Visibility">
              <select
                value={config.facebookVisibility}
                onChange={(e) =>
                  onConfigChange(activeTab, "facebookVisibility", e.target.value)
                }
                className={selectCls}
              >
                <option value="EVERYONE">Public</option>
                <option value="FRIENDS">Friends</option>
                <option value="ONLY_ME">Only Me</option>
              </select>
            </Field>
          </>
        )}

        {/* INSTAGRAM */}
        {activeTab === "instagram" && (
          <>
            <Field label="Post Type">
              <select
                value={config.instagramPostType}
                onChange={(e) =>
                  onConfigChange(activeTab, "instagramPostType", e.target.value)
                }
                className={selectCls}
              >
                <option value="post">Post</option>
                <option value="reel">Reel</option>
                <option value="story">Story</option>
              </select>
            </Field>

            <Field label="Hashtags">
              <input
                value={config.instagramHashtags}
                onChange={(e) =>
                  onConfigChange(activeTab, "instagramHashtags", e.target.value)
                }
                className={inputCls}
              />
            </Field>
          </>
        )}

        {/* LINKEDIN */}
        {activeTab === "linkedin" && (
          <Field label="Audience">
            <select
              value={config.linkedinAudience}
              onChange={(e) =>
                onConfigChange(activeTab, "linkedinAudience", e.target.value)
              }
              className={selectCls}
            >
              <option value="PUBLIC">Public</option>
              <option value="CONNECTIONS">Connections</option>
            </select>
          </Field>
        )}

        {/* TWITTER */}
        {activeTab === "twitter" && (
          <Field label="Reply Settings">
            <select
              value={config.twitterReplySettings}
              onChange={(e) =>
                onConfigChange(activeTab, "twitterReplySettings", e.target.value)
              }
              className={selectCls}
            >
              <option value="everyone">Everyone</option>
              <option value="mentionedUsers">Mentioned only</option>
            </select>
          </Field>
        )}

      </div>

      {/* BUTTON */}
      <div className="border-t p-4">
        <button
          onClick={handleSchedule}
          className="w-full bg-[#b8871a] text-white py-2 rounded-lg"
        >
          Schedule for later
        </button>
      </div>
    </div>
  );
}