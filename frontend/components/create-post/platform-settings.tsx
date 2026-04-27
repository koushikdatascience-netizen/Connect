// components/create-post/platform-settings.tsx
"use client";

import { ReactNode } from "react";

import { PlatformLogo } from "@/components/platform-logo";
import {
  PLATFORM_LABELS,
  PLATFORM_META,
} from "@/components/create-post/constants";
import {
  PlatformConfigMap,
  SelectedAccountsMap,
} from "@/components/create-post/types";
import { Account, PlatformName } from "@/lib/types";

type Props = {
  selectedPlatforms: PlatformName[];
  selectedAccounts: SelectedAccountsMap;
  platformConfigs: PlatformConfigMap;
  accountsByPlatform: Record<PlatformName, Account[]>;
  expandedPlatforms: Record<string, boolean>;
  onToggleExpand: (platform: PlatformName) => void;
  onConfigChange: <K extends keyof PlatformConfigMap[PlatformName]>(
    platform: PlatformName,
    key: K,
    value: PlatformConfigMap[PlatformName][K],
  ) => void;
};

function selectedAccountLabels(accounts: Account[], selectedIds: number[]) {
  return accounts
    .filter((account) => selectedIds.includes(account.id))
    .map((account) => account.account_name);
}

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
    <div>
      <label className="mb-2 block text-sm font-semibold text-[#1f2937]">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs leading-5 text-[#344054]">{hint}</p>}
    </div>
  );
}

function ToggleCard({
  checked,
  title,
  description,
  onChange,
}: {
  checked: boolean;
  title: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-[#eadba6] bg-[#fffef9] p-4 cursor-pointer hover:bg-[#fff7d1] transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-[#d8c36e] bg-white text-[#ffd24b] focus:ring-[#ffd24b]"
      />
      <div>
        <div className="text-sm font-semibold text-[#111111]">{title}</div>
        <div className="mt-1 text-xs leading-5 text-[#344054]">{description}</div>
      </div>
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-[#eadba6] bg-[#fffef9] px-4 py-3 text-sm text-[#111111] outline-none transition-all duration-200 placeholder:text-[#6b7280] focus:border-[#F5C800] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,200,0,0.16)]";

const textareaClassName = `${inputClassName} min-h-[100px] resize-y`;

export function PlatformSettings({
  selectedPlatforms,
  selectedAccounts,
  platformConfigs,
  accountsByPlatform,
  expandedPlatforms,
  onToggleExpand,
  onConfigChange,
}: Props) {
  return (
    <section className="mx-6 mb-6 rounded-[24px] border border-[#f0e2b2] bg-[#fffdf8] p-5 shadow-[0_16px_40px_rgba(180,144,34,0.08)] sm:p-6">
      <div className="border-b border-[#f0e2b2] pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c89a00]">
          Step 2 • Platform Settings
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#111111]">
          Customize per platform
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#344054]">
          Fine-tune how your post appears on each social network.
        </p>
      </div>

      {!selectedPlatforms.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#f0e2b2] bg-[#fffef9] px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#fff7cf] text-[#c89a00]">
            <span className="text-lg">+</span>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#111111]">
            No platforms selected yet
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#344054]">
            Choose platforms from the sidebar to see their specific settings here.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {selectedPlatforms.map((platform) => {
            const config = platformConfigs[platform] || {};
            const expanded = expandedPlatforms[platform] ?? true;
            const accountNames = selectedAccountLabels(
              accountsByPlatform[platform] || [],
              selectedAccounts[platform] || []
            );

            return (
              <article
                key={platform}
                className="overflow-hidden rounded-2xl border border-[#f0e2b2] bg-[#fffef9] shadow-[0_10px_28px_rgba(180,144,34,0.08)]"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => onToggleExpand(platform)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#fff7d1] transition-all"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${PLATFORM_META[platform]?.surfaceClass || "bg-gray-100"}`}
                    >
                      <PlatformLogo platform={platform} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[#111111]">
                        {PLATFORM_LABELS[platform]}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[#344054]">
                        {accountNames.length
                          ? accountNames.join(", ")
                          : "No accounts selected"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-[#c89a00]">
                    {expanded ? "Hide settings" : "Show settings"}
                  </span>
                </button>

                {/* Settings Content */}
                <div
                  className={`grid transition-all duration-300 ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-[#f0e2b2] px-5 py-6">
                      <div className="grid gap-6">

                        {/* Common Schedule */}
                        <Field
                          label="Schedule Time"
                          hint="Leave empty to publish immediately."
                        >
                          <input
                            type="datetime-local"
                            value={config.schedule || ""}
                            onChange={(e) => onConfigChange(platform, "schedule", e.target.value)}
                            className={inputClassName}
                          />
                        </Field>

                        {/* ==================== YOUTUBE - FULLY COMPLETE ==================== */}
                        {platform === "youtube" && (
                          <>
                            <Field label="Video Title">
                              <input
                                value={config.youtubeTitle || ""}
                                onChange={(e) => onConfigChange(platform, "youtubeTitle", e.target.value)}
                                placeholder="Enter engaging video title"
                                className={inputClassName}
                                maxLength={100}
                              />
                            </Field>

                            <Field label="Video Description">
                              <textarea
                                value={config.youtubeDescription || ""}
                                onChange={(e) => onConfigChange(platform, "youtubeDescription", e.target.value)}
                                placeholder="Detailed description with timestamps, links, and calls to action..."
                                className={textareaClassName}
                              />
                            </Field>

                            <Field label="Privacy Status">
                              <select
                                value={config.youtubePrivacy || "public"}
                                onChange={(e) => onConfigChange(platform, "youtubePrivacy", e.target.value as any)}
                                className={inputClassName}
                              >
                                <option value="public">Public</option>
                                <option value="unlisted">Unlisted</option>
                                <option value="private">Private</option>
                              </select>
                            </Field>

                            <Field label="Tags (comma separated)">
                              <input
                                value={config.youtubeTags || ""}
                                onChange={(e) => onConfigChange(platform, "youtubeTags", e.target.value)}
                                placeholder="tutorial, marketing, 2026, tips"
                                className={inputClassName}
                              />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <Field label="Category">
                                <select
                                  value={config.youtubeCategory || "22"}
                                  onChange={(e) => onConfigChange(platform, "youtubeCategory", e.target.value)}
                                  className={inputClassName}
                                >
                                  <option value="22">People & Blogs</option>
                                  <option value="10">Music</option>
                                  <option value="23">Comedy</option>
                                  <option value="24">Entertainment</option>
                                  <option value="27">Education</option>
                                  <option value="28">Science & Technology</option>
                                </select>
                              </Field>

                              <ToggleCard
                                checked={config.youtubeMadeForKids || false}
                                onChange={(checked) => onConfigChange(platform, "youtubeMadeForKids", checked)}
                                title="Made for Kids"
                                description="Mark this video as made for kids (affects recommendations and comments)"
                              />
                            </div>

                            <ToggleCard
                              checked={config.youtubeNotifySubscribers || true}
                              onChange={(checked) => onConfigChange(platform, "youtubeNotifySubscribers", checked)}
                              title="Notify Subscribers"
                              description="Send notification to your subscribers when the video is published"
                            />
                          </>
                        )}

                        {/* Instagram */}
                        {platform === "instagram" && (
                          <>
                            <Field label="Post Type">
                              <select
                                value={config.instagramPostType || "post"}
                                onChange={(e) => onConfigChange(platform, "instagramPostType", e.target.value as any)}
                                className={inputClassName}
                              >
                                <option value="post">Feed Post</option>
                                <option value="reel">Reel</option>
                                <option value="story">Story</option>
                              </select>
                            </Field>

                            <Field label="Hashtags">
                              <input
                                value={config.instagramHashtags || ""}
                                onChange={(e) => onConfigChange(platform, "instagramHashtags", e.target.value)}
                                placeholder="#brand #marketing"
                                className={inputClassName}
                              />
                            </Field>

                            <ToggleCard
                              checked={config.instagramFirstCommentEnabled || false}
                              onChange={(checked) => onConfigChange(platform, "instagramFirstCommentEnabled", checked)}
                              title="Use First Comment for Hashtags"
                              description="Keep main caption clean by moving hashtags to the first comment"
                            />

                            {config.instagramFirstCommentEnabled && (
                              <Field label="First Comment">
                                <textarea
                                  value={config.instagramFirstComment || ""}
                                  onChange={(e) => onConfigChange(platform, "instagramFirstComment", e.target.value)}
                                  className={textareaClassName}
                                />
                              </Field>
                            )}
                          </>
                        )}

                        {/* Facebook, LinkedIn, Twitter - (kept shorter for brevity) */}
                        {platform === "facebook" && (
                          <Field label="Visibility">
                            <select
                              value={config.facebookVisibility || "public"}
                              onChange={(e) => onConfigChange(platform, "facebookVisibility", e.target.value as any)}
                              className={inputClassName}
                            >
                              <option value="public">Public</option>
                              <option value="friends">Friends</option>
                              <option value="only_me">Only Me</option>
                            </select>
                          </Field>
                        )}

                        {platform === "linkedin" && (
                          <>
                            <Field label="Audience">
                              <select
                                value={config.linkedinAudience || "PUBLIC"}
                                onChange={(e) => onConfigChange(platform, "linkedinAudience", e.target.value as any)}
                                className={inputClassName}
                              >
                                <option value="PUBLIC">Public</option>
                                <option value="CONNECTIONS">Connections Only</option>
                              </select>
                            </Field>
                          </>
                        )}

                        {platform === "twitter" && (
                          <Field label="Reply Settings">
                            <select
                              value={config.twitterReplySettings || "everyone"}
                              onChange={(e) => onConfigChange(platform, "twitterReplySettings", e.target.value as any)}
                              className={inputClassName}
                            >
                              <option value="everyone">Everyone</option>
                              <option value="mentionedUsers">Mentioned Users</option>
                              <option value="following">Following Only</option>
                            </select>
                          </Field>
                        )}

                        {/* Fallback for other platforms */}
                        {["blogger", "google_business", "wordpress"].includes(platform) && (
                          <div className="rounded-2xl border border-[#f0e2b2] bg-[#fff8dc] p-5 text-sm text-[#344054]">
                            <strong>Note:</strong> {PLATFORM_LABELS[platform]} uses default settings for now. 
                            Advanced options (tags, categories, etc.) will be added soon.
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}