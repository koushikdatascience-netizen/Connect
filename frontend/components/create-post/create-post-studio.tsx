"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  PLATFORM_LABELS,
  PLATFORM_META,
  PLATFORM_ORDER,
  createDefaultPlatformConfig,
} from "@/components/create-post/constants";
import { PlatformSettings } from "@/components/create-post/platform-settings";
import { PostEditor } from "@/components/create-post/post-editor";
import { Sidebar } from "@/components/create-post/sidebar";
import { PlatformLogo } from "@/components/platform-logo";
import {
  PlatformConfigMap,
  SavedAccountGroup,
  SelectedAccountsMap,
} from "@/components/create-post/types";
import { createPost, fetchAccounts, fetchMedia, uploadMedia } from "@/lib/api";
import { Account, MediaAsset, PlatformName } from "@/lib/types";

const ACCOUNT_GROUPS_KEY = "snapkey_account_groups_v1";

/* ---------------- HELPERS (UNCHANGED) ---------------- */

function createEmptySelectedAccounts(): SelectedAccountsMap {
  return {
    facebook: [],
    instagram: [],
    linkedin: [],
    twitter: [],
    youtube: [],
    blogger: [],
    google_business: [],
    wordpress: [],
  };
}

function createEmptyConfigs(): PlatformConfigMap {
  return {
    facebook: createDefaultPlatformConfig(),
    instagram: createDefaultPlatformConfig(),
    linkedin: createDefaultPlatformConfig(),
    twitter: createDefaultPlatformConfig(),
    youtube: createDefaultPlatformConfig(),
    blogger: createDefaultPlatformConfig(),
    google_business: createDefaultPlatformConfig(),
    wordpress: createDefaultPlatformConfig(),
  };
}

/* ---------------- COMPONENT ---------------- */

export function CreatePostStudio() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);
  const [selectedAccounts, setSelectedAccounts] =
    useState<SelectedAccountsMap>(createEmptySelectedAccounts);
  const [platformConfigs, setPlatformConfigs] =
    useState<PlatformConfigMap>(createEmptyConfigs);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");
  const [altText, setAltText] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [activePlatformTab, setActivePlatformTab] =
    useState<PlatformName | null>(null);

  /* ---------------- DATA LOAD ---------------- */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [accountData, mediaData] = await Promise.all([
          fetchAccounts(),
          fetchMedia(),
        ]);
        setAccounts(accountData.filter((a) => a.is_active));
        setMedia(mediaData);
      } catch (e) {
        setError("Failed to load composer.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------- DERIVED ---------------- */

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_ORDER.reduce((acc, platform) => {
      acc[platform] = accounts.filter(
        (a) => a.platform?.toLowerCase() === platform
      );
      return acc;
    }, {} as Record<PlatformName, Account[]>);
  }, [accounts]);

  const sidebarPlatforms = useMemo(
    () =>
      PLATFORM_ORDER.map((platform) => ({
        ...PLATFORM_META[platform],
        accounts: accountsByPlatform[platform],
        selectedAccountIds: selectedAccounts[platform],
        selected: selectedPlatforms.includes(platform),
      })),
    [accountsByPlatform, selectedAccounts, selectedPlatforms]
  );

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2]">
        <div className="rounded-lg border border-[#eee3d0] bg-white px-4 py-2 text-sm text-[#6f6558]">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#faf7f2]">

      {/* Notifications */}
      {(message || error) && (
        <div className="px-4 pt-4">
          {message && (
            <div className="mb-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
              <button onClick={() => setMessage(null)} className="ml-auto">
                ×
              </button>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
              <button onClick={() => setError(null)} className="ml-auto">
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 gap-4 overflow-hidden px-4 py-4">

        {/* LEFT */}
        <div className="w-[220px] shrink-0 overflow-y-auto">
          <Sidebar
            platforms={sidebarPlatforms}
            totalSelectedAccounts={0}
            totalAccounts={accounts.length}
            groupName=""
            accountGroups={[]}
            onGroupNameChange={() => {}}
            onSaveGroup={() => {}}
            onApplyGroup={() => {}}
            onRemoveGroup={() => {}}
            onSelectAll={() => {}}
            onPlatformToggle={() => {}}
            onSelectAllAccounts={() => {}}
            onAccountToggle={() => {}}
          />
        </div>

        {/* CENTER */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Header */}
          <div className="mb-3 rounded-xl border border-[#eee3d0] bg-white px-4 py-3">
            <p className="text-xs text-[#6f6558]">Compose</p>
            <h1 className="text-xl font-semibold text-[#1f170c]">
              Create post
            </h1>
          </div>

          {/* Chips */}
          {selectedPlatforms.length > 0 && (
            <div className="mb-3 flex gap-2 rounded-xl border border-[#eee3d0] bg-white px-3 py-2">
              {selectedPlatforms.map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-1 rounded-full bg-[#f5f1e8] px-2 py-0.5 text-xs"
                >
                  <PlatformLogo platform={p} className="h-3.5 w-3.5" />
                  {p}
                  <button onClick={() => {}}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 overflow-y-auto">
            <PostEditor
              caption={caption}
              hashtags={hashtags}
              mentions={mentions}
              altText={altText}
              media={media}
              selectedMediaIds={selectedMediaIds}
              selectedPlatforms={selectedPlatforms}
              previewEnabled={true}
              aiPanelOpen={false}
              uploading={false}
              onCaptionChange={setCaption}
              onHashtagsChange={setHashtags}
              onMentionsChange={setMentions}
              onAltTextChange={setAltText}
              onMediaSelectionToggle={() => {}}
              onFilesSelected={() => {}}
              onPreviewToggle={() => {}}
              onAiPanelToggle={() => {}}
              onApplyAiAssist={() => {}}
            />
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-[260px] shrink-0 rounded-xl border border-[#eee3d0] bg-white px-4 py-3">
          <PlatformSettings
            selectedPlatforms={selectedPlatforms}
            selectedAccounts={selectedAccounts}
            platformConfigs={platformConfigs}
            accountsByPlatform={accountsByPlatform}
            expandedPlatforms={{}}
            activePlatformTab={activePlatformTab}
            onTabChange={setActivePlatformTab}
            onToggleExpand={() => {}}
            onConfigChange={() => {}}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#eee3d0] bg-white px-4 py-3">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={submitting}
            className="rounded-lg bg-black px-4 py-1.5 text-sm text-white"
          >
            {submitting ? "Creating..." : "Publish"}
          </button>
        </div>
      </div>
    </main>
  );
}