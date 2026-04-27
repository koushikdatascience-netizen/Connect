// components/create-post/create-post-studio.tsx
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
import {
  PlatformConfigMap,
  SavedAccountGroup,
  SelectedAccountsMap,
} from "@/components/create-post/types";
import { createPost, fetchAccounts, fetchMedia, uploadMedia } from "@/lib/api";
import { Account, MediaAsset, PlatformName } from "@/lib/types";

const ACCOUNT_GROUPS_KEY = "snapkey_account_groups_v1";

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
    facebook: createDefaultPlatformConfig("facebook"),
    instagram: createDefaultPlatformConfig("instagram"),
    linkedin: createDefaultPlatformConfig("linkedin"),
    twitter: createDefaultPlatformConfig("twitter"),
    youtube: createDefaultPlatformConfig("youtube"),
    blogger: createDefaultPlatformConfig("blogger"),
    google_business: createDefaultPlatformConfig("google_business"),
    wordpress: createDefaultPlatformConfig("wordpress"),
  } as PlatformConfigMap;
}

function normalizePlatform(platform: string | null | undefined): PlatformName | null {
  const value = (platform || "").trim().toLowerCase();
  return PLATFORM_ORDER.includes(value as PlatformName) ? (value as PlatformName) : null;
}

function dedupeNumberList(values: number[]): number[] {
  return [...new Set(values)];
}

function readSavedGroups(): SavedAccountGroup[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ACCOUNT_GROUPS_KEY) || "[]");
    return Array.isArray(parsed) ? (parsed as SavedAccountGroup[]) : [];
  } catch {
    return [];
  }
}

function writeSavedGroups(groups: SavedAccountGroup[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNT_GROUPS_KEY, JSON.stringify(groups));
}

function normalizeTagList(value: string, prefix: "#" | "@"): string {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith(prefix) ? item : `${prefix}${item}`))
    .join(" ");
}

function toUtcIsoString(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function buildPlatformContent(
  caption: string,
  hashtags: string,
  mentions: string,
  platform: PlatformName,
  configs: PlatformConfigMap
): string {
  const parts: string[] = [caption.trim()].filter(Boolean);

  if (hashtags.trim()) parts.push(normalizeTagList(hashtags, "#"));
  if (mentions.trim()) parts.push(normalizeTagList(mentions, "@"));

  if (platform === "instagram" && (configs.instagram as any)?.instagramHashtags) {
    parts.push(normalizeTagList((configs.instagram as any).instagramHashtags, "#"));
  }
  if (platform === "linkedin" && (configs.linkedin as any)?.linkedinHashtags) {
    parts.push(normalizeTagList((configs.linkedin as any).linkedinHashtags, "#"));
  }

  return parts.join("\n\n");
}

function buildPlatformPayload(platform: PlatformName, config: any) {
  switch (platform) {
    case "youtube":
      return {
        youtube: {
          title: config.youtubeTitle,
          description: config.youtubeDescription,
          privacy: config.youtubePrivacy,
          tags: config.youtubeTags,
          made_for_kids: config.youtubeMadeForKids,
          notify_subscribers: config.youtubeNotifySubscribers,
        },
      };
    case "instagram":
      return {
        instagram: {
          post_type: config.instagramPostType,
          hashtags: config.instagramHashtags,
          first_comment_enabled: config.instagramFirstCommentEnabled,
          first_comment: config.instagramFirstComment,
        },
      };
    default:
      return { [platform]: {} };
  }
}

export function CreatePostStudio() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccountsMap>(createEmptySelectedAccounts());
  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfigMap>(createEmptyConfigs());
  const [accountGroups, setAccountGroups] = useState<SavedAccountGroup[]>([]);
  const [groupName, setGroupName] = useState("");
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<PlatformName, boolean>>({} as Record<PlatformName, boolean>);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");
  const [altText, setAltText] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);

  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [accountData, mediaData] = await Promise.all([fetchAccounts(), fetchMedia()]);
        setAccounts(accountData.filter((account) => account.is_active));
        setMedia(mediaData);
        setAccountGroups(readSavedGroups());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load composer.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_ORDER.reduce<Record<PlatformName, Account[]>>((acc, platform) => {
      acc[platform] = accounts.filter((account) => normalizePlatform(account.platform) === platform);
      return acc;
    }, {} as Record<PlatformName, Account[]>);
  }, [accounts]);

  const totalSelectedAccounts = useMemo(() => {
    return PLATFORM_ORDER.reduce((count, platform) => count + (selectedAccounts[platform]?.length || 0), 0);
  }, [selectedAccounts]);

  const sidebarPlatforms = useMemo(() => {
    return PLATFORM_ORDER.map((platform) => ({
      ...PLATFORM_META[platform],
      accounts: accountsByPlatform[platform],
      selectedAccountIds: selectedAccounts[platform] || [],
      selected: selectedPlatforms.includes(platform),
    }));
  }, [accountsByPlatform, selectedAccounts, selectedPlatforms]);

  // Fixed: Explicit types for all parameters
  function setPlatformEnabled(platform: PlatformName, enabled: boolean) {
    setSelectedPlatforms((current: PlatformName[]) =>
      enabled
        ? current.includes(platform) ? current : [...current, platform]
        : current.filter((p) => p !== platform)
    );

    if (!enabled) {
      setSelectedAccounts((current: SelectedAccountsMap) => ({ ...current, [platform]: [] }));
    } else if (!selectedAccounts[platform]?.length) {
      const firstAccount = accountsByPlatform[platform]?.[0];
      if (firstAccount) {
        setSelectedAccounts((current: SelectedAccountsMap) => ({
          ...current,
          [platform]: [firstAccount.id],
        }));
      }
    }

    setExpandedPlatforms((current: Record<PlatformName, boolean>) => ({ ...current, [platform]: enabled }));
  }

  function toggleAccount(platform: PlatformName, accountId: number, enabled: boolean) {
    setSelectedAccounts((current: SelectedAccountsMap) => {
      const nextIds = enabled
        ? dedupeNumberList([...(current[platform] || []), accountId])
        : (current[platform] || []).filter((id) => id !== accountId);

      return { ...current, [platform]: nextIds };
    });
  }

  function toggleAllAccounts(platform: PlatformName, enabled: boolean) {
    const allIds = accountsByPlatform[platform]?.map((a) => a.id) || [];
    setSelectedAccounts((current: SelectedAccountsMap) => ({
      ...current,
      [platform]: enabled ? allIds : [],
    }));
  }

  function toggleAllGlobalAccounts(enabled: boolean) {
    const nextSelected = PLATFORM_ORDER.reduce<SelectedAccountsMap>((acc, platform) => {
      acc[platform] = enabled ? (accountsByPlatform[platform] || []).map((a) => a.id) : [];
      return acc;
    }, createEmptySelectedAccounts());

    setSelectedAccounts(nextSelected);
    setSelectedPlatforms(enabled ? PLATFORM_ORDER.filter((p) => (accountsByPlatform[p] || []).length > 0) : []);
  }

  function updatePlatformConfig<K extends keyof PlatformConfigMap[PlatformName]>(
    platform: PlatformName,
    key: K,
    value: PlatformConfigMap[PlatformName][K]
  ) {
    setPlatformConfigs((current: PlatformConfigMap) => ({
      ...current,
      [platform]: {
        ...current[platform],
        [key]: value,
      },
    }));
  }

  async function handleSubmit() {
    if (!selectedPlatforms.length) {
      setError("Please select at least one platform.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const requests = selectedPlatforms.flatMap((platform) =>
        (selectedAccounts[platform] || []).map((accountId) =>
          createPost({
            social_account_id: accountId,
            content: buildPlatformContent(caption, hashtags, mentions, platform, platformConfigs),
            scheduled_at: toUtcIsoString(platformConfigs[platform]?.schedule),
            media_ids: selectedMediaIds,
            platform_options: buildPlatformPayload(platform, platformConfigs[platform]),
          })
        )
      );

      await Promise.all(requests);
      setMessage(`Successfully created ${requests.length} post${requests.length > 1 ? "s" : ""}!`);

      // Reset form
      setCaption("");
      setHashtags("");
      setMentions("");
      setSelectedMediaIds([]);
      setSelectedPlatforms([]);
      setSelectedAccounts(createEmptySelectedAccounts());
      setPlatformConfigs(createEmptyConfigs());
      setExpandedPlatforms({} as Record<PlatformName, boolean>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create posts.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-12 text-center">Loading composer...</div>;
  }

  return (
    <main className="min-h-screen bg-[#fffaf0] px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <section className="mb-6 rounded-[28px] border border-[#f2d75c] bg-[#F5C800] px-7 py-6 shadow-[0_18px_45px_rgba(245,200,0,0.22)]">
          <h1 className="text-2xl font-semibold text-[#111111]">Create & Publish Content</h1>
          <p className="text-[13px] text-[rgba(0,0,0,0.55)]">Write once. Publish everywhere.</p>
        </section>

        {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
        {message && <div className="mb-4 rounded-xl bg-green-50 p-4 text-green-700">{message}</div>}

        <div className="overflow-hidden rounded-[28px] border border-[#f0e2b2] bg-[#fffdf8] shadow-[0_20px_60px_rgba(180,144,34,0.10)] xl:grid xl:grid-cols-[minmax(320px,360px)_minmax(0,1fr)]">
          <Sidebar
            platforms={sidebarPlatforms}
            totalSelectedAccounts={totalSelectedAccounts}
            totalAccounts={accounts.length}
            groupName={groupName}
            accountGroups={accountGroups}
            onGroupNameChange={setGroupName}
            onSaveGroup={() => {/* implement your logic */}}
            onApplyGroup={() => {/* implement your logic */}}
            onRemoveGroup={() => {/* implement your logic */}}
            onSelectAll={toggleAllGlobalAccounts}
            onPlatformToggle={setPlatformEnabled}
            onSelectAllAccounts={toggleAllAccounts}
            onAccountToggle={toggleAccount}
          />

          <div className="space-y-6 xl:border-l xl:border-[#f0e2b2]">
            <PostEditor
              caption={caption}
              hashtags={hashtags}
              mentions={mentions}
              altText={altText}
              media={media}
              selectedMediaIds={selectedMediaIds}
              selectedPlatforms={selectedPlatforms}
              previewEnabled={previewEnabled}
              aiPanelOpen={aiPanelOpen}
              uploading={uploading}
              onCaptionChange={setCaption}
              onHashtagsChange={setHashtags}
              onMentionsChange={setMentions}
              onAltTextChange={setAltText}
              onMediaSelectionToggle={(mediaId, enabled) => {
                setSelectedMediaIds((current) =>
                  enabled 
                    ? dedupeNumberList([...current, mediaId])
                    : current.filter((id) => id !== mediaId)
                );
              }}
              onFilesSelected={() => {}}
              onPreviewToggle={() => setPreviewEnabled((prev) => !prev)}
              onAiPanelToggle={() => setAiPanelOpen((prev) => !prev)}
              onApplyAiAssist={() => {}}
            />

            <PlatformSettings
              selectedPlatforms={selectedPlatforms}
              selectedAccounts={selectedAccounts}
              platformConfigs={platformConfigs}
              accountsByPlatform={accountsByPlatform}
              expandedPlatforms={expandedPlatforms}
              onToggleExpand={(platform: PlatformName) =>
                setExpandedPlatforms((current) => ({
                  ...current,
                  [platform]: !current[platform],
                }))
              }
              onConfigChange={updatePlatformConfig}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#f0e2b2] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] flex justify-end gap-3 px-6 py-4">
          <button onClick={() => router.back()} className="secondary-button px-6 py-2.5">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || selectedPlatforms.length === 0}
            className="primary-button px-8 py-2.5 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Posts"}
          </button>
        </div>
      </div>
    </main>
  );
}