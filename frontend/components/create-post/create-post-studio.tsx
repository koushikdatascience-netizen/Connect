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

function normalizePlatform(platform: string | null | undefined): PlatformName | null {
  const value = (platform || "").trim().toLowerCase();
  return PLATFORM_ORDER.includes(value as PlatformName) ? (value as PlatformName) : null;
}

function dedupeNumberList(values: number[]) {
  return [...new Set(values)];
}

function dedupeStringList(values: string[]) {
  return [...new Set(values)];
}

function readSavedGroups() {
  if (typeof window === "undefined") return [] as SavedAccountGroup[];
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

function normalizeTagList(value: string, prefix: "#" | "@") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => (item.startsWith(prefix) ? item : `${prefix}${item}`))
    .join(" ");
}

function toUtcIsoString(value: string) {
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
  configs: PlatformConfigMap,
) {
  const parts = [caption.trim()];
  const globalHashtags = normalizeTagList(hashtags, "#");
  const globalMentions = normalizeTagList(mentions, "@");

  if (globalHashtags) parts.push(globalHashtags);
  if (globalMentions) parts.push(globalMentions);

  if (platform === "instagram") {
    const instagramTags = normalizeTagList(configs.instagram.instagramHashtags, "#");
    if (instagramTags) parts.push(instagramTags);
  }

  if (platform === "linkedin") {
    const linkedinTags = normalizeTagList(configs.linkedin.linkedinHashtags, "#");
    if (linkedinTags) parts.push(linkedinTags);
  }

  return parts.filter(Boolean).join("\n\n");
}

function buildPlatformPayload(platform: PlatformName, config: PlatformConfigMap[PlatformName]) {
  if (platform === "facebook") {
    return {
      facebook: {
        page_selection: config.facebookPageId,
        visibility: config.facebookVisibility,
        cta_button: config.facebookCta,
      },
    };
  }

  if (platform === "instagram") {
    return {
      instagram: {
        caption_style: config.instagramCaptionStyle,
        hashtags: config.instagramHashtags,
        first_comment_enabled: config.instagramFirstCommentEnabled,
        first_comment: config.instagramFirstComment || null,
        post_type: config.instagramPostType,
      },
    };
  }

  if (platform === "linkedin") {
    return {
      linkedin: {
        visibility: config.linkedinAudience,
        hashtags: config.linkedinHashtags,
        entity_type: config.linkedinEntityType,
      },
    };
  }

  if (platform === "twitter") {
    return {
      twitter: {
        reply_settings: config.twitterReplySettings,
        thread_mode: config.twitterThreadMode,
        sensitive_media: config.twitterSensitive,
        card_enabled: config.twitterCardEnabled,
        super_followers_only: config.twitterForSuperFollowers,
      },
    };
  }

  if (platform === "youtube") {
    return {
      youtube: {
        title: config.youtubeTitle,
        privacy: config.youtubePrivacy,
        category_id: config.youtubeCategoryId,
        tags: config.youtubeTags,
        notify_subscribers: config.youtubeNotifySubscribers,
        embeddable: config.youtubeEmbeddable,
        license: config.youtubeLicense,
        made_for_kids: config.youtubeMadeForKids,
        language: config.youtubeLanguage,
        default_audio_language: config.youtubeDefaultAudioLanguage,
        publish_at: toUtcIsoString(config.youtubePublishAt),
      },
    };
  }

  if (platform === "blogger") {
    return {
      blogger: {
        title: config.bloggerTitle,
        labels: config.bloggerLabels,
        is_draft: config.bloggerIsDraft,
        reader_comments: config.bloggerReaderComments,
        custom_meta_robots_tags: config.bloggerCustomMetaRobotsTags,
        location: config.bloggerLocation,
      },
    };
  }

  if (platform === "google_business") {
    return {
      google_business: {
        post_type: config.googleBusinessPostType,
        topic_type: config.googleBusinessTopicType,
        cta: config.googleBusinessCta,
        cta_url: config.googleBusinessCtaUrl,
        event_title: config.googleBusinessEventTitle,
        event_start_date: config.googleBusinessEventStartDate,
        event_end_date: config.googleBusinessEventEndDate,
        offer_code: config.googleBusinessOfferCode,
        offer_redeem_url: config.googleBusinessOfferRedeemUrl,
        offer_terms: config.googleBusinessOfferTerms,
        alert_type: config.googleBusinessAlertType,
      },
    };
  }

  if (platform === "wordpress") {
    return {
      wordpress: {
        title: config.wordpressTitle,
        status: config.wordpressStatus,
        categories: config.wordpressCategories,
        tags: config.wordpressTags,
        slug: config.wordpressSlug,
        excerpt: config.wordpressExcerpt,
        comment_status: config.wordpressCommentStatus,
        ping_status: config.wordpressPingStatus,
        featured_media_enabled: config.wordpressFeaturedMediaEnabled,
        format: config.wordpressFormat,
        sticky: config.wordpressSticky,
        author_id: config.wordpressAuthorId,
        password: config.wordpressPassword,
      },
    };
  }

  return { [platform]: {} };
}

function validatePlatformBeforeSubmit(platform: PlatformName, config: PlatformConfigMap[PlatformName]) {
  if (platform === "youtube" && !config.youtubeTitle.trim()) {
    return "YouTube video title is required.";
  }

  if (platform === "blogger" && !config.bloggerTitle.trim()) {
    return "Blogger post title is required.";
  }

  if (platform === "wordpress" && !config.wordpressTitle.trim()) {
    return "WordPress post title is required.";
  }

  if (platform === "google_business") {
    if (config.googleBusinessPostType === "EVENT") {
      if (!config.googleBusinessEventTitle.trim()) return "Google Business event title is required.";
      if (!config.googleBusinessEventStartDate) return "Google Business event start date is required.";
      if (!config.googleBusinessEventEndDate) return "Google Business event end date is required.";
    }

    if (config.googleBusinessPostType === "OFFER" && !config.googleBusinessOfferTerms.trim()) {
      return "Google Business offer terms are required for offer posts.";
    }

    if (config.googleBusinessCta !== "NONE" && !config.googleBusinessCtaUrl.trim()) {
      return "Google Business CTA URL is required when a CTA button is selected.";
    }
  }

  return null;
}

export function CreatePostStudio() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccountsMap>(createEmptySelectedAccounts);
  const [platformConfigs, setPlatformConfigs] = useState<PlatformConfigMap>(createEmptyConfigs);
  const [accountGroups, setAccountGroups] = useState<SavedAccountGroup[]>([]);
  const [groupName, setGroupName] = useState("");
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<string, boolean>>({});
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
  const [activePlatformTab, setActivePlatformTab] = useState<PlatformName | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [accountData, mediaData] = await Promise.all([fetchAccounts(), fetchMedia()]);
        setAccounts(accountData.filter((account) => account.is_active));
        setMedia(mediaData);
        setAccountGroups(readSavedGroups());
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load the composer.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      if (!activePlatformTab || !selectedPlatforms.includes(activePlatformTab)) {
        setActivePlatformTab(selectedPlatforms[0]);
      }
    } else {
      setActivePlatformTab(null);
    }
  }, [selectedPlatforms, activePlatformTab]);

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_ORDER.reduce<Record<PlatformName, Account[]>>((acc, platform) => {
      acc[platform] = accounts.filter((account) => normalizePlatform(account.platform) === platform);
      return acc;
    }, {} as Record<PlatformName, Account[]>);
  }, [accounts]);

  const totalAccounts = accounts.length;

  const totalSelectedAccounts = useMemo(
    () => PLATFORM_ORDER.reduce((count, platform) => count + selectedAccounts[platform].length, 0),
    [selectedAccounts],
  );

  const sidebarPlatforms = useMemo(
    () =>
      PLATFORM_ORDER.map((platform) => ({
        ...PLATFORM_META[platform],
        accounts: accountsByPlatform[platform],
        selectedAccountIds: selectedAccounts[platform],
        selected: selectedPlatforms.includes(platform),
      })),
    [accountsByPlatform, selectedAccounts, selectedPlatforms],
  );

  function setPlatformEnabled(platform: PlatformName, enabled: boolean) {
    setSelectedPlatforms((current) => {
      if (enabled) {
        return current.includes(platform) ? current : [...current, platform];
      }
      return current.filter((item) => item !== platform);
    });

    setSelectedAccounts((current) => {
      if (!enabled) {
        return { ...current, [platform]: [] };
      }

      if (current[platform].length) return current;
      const firstAccount = accountsByPlatform[platform][0];
      return {
        ...current,
        [platform]: firstAccount ? [firstAccount.id] : [],
      };
    });

    setExpandedPlatforms((current) => ({ ...current, [platform]: enabled }));
    if (enabled) setActivePlatformTab(platform);
  }

  function toggleAccount(platform: PlatformName, accountId: number, enabled: boolean) {
    const nextAccountIds = enabled
      ? dedupeNumberList([...selectedAccounts[platform], accountId])
      : selectedAccounts[platform].filter((id) => id !== accountId);

    setSelectedAccounts((current) => ({
      ...current,
      [platform]: nextAccountIds,
    }));

    setSelectedPlatforms((current) => {
      if (enabled) {
        return current.includes(platform) ? current : [...current, platform];
      }
      return nextAccountIds.length ? current : current.filter((item) => item !== platform);
    });

    setExpandedPlatforms((current) => ({ ...current, [platform]: true }));
    if (enabled) setActivePlatformTab(platform);
  }

  function toggleAllAccounts(platform: PlatformName, enabled: boolean) {
    const allIds = accountsByPlatform[platform].map((account) => account.id);
    const nextIds = enabled ? allIds : [];

    setSelectedAccounts((current) => ({
      ...current,
      [platform]: nextIds,
    }));

    setSelectedPlatforms((current) => {
      if (enabled && nextIds.length) {
        return current.includes(platform) ? current : [...current, platform];
      }
      return current.filter((item) => item !== platform);
    });

    setExpandedPlatforms((current) => ({ ...current, [platform]: true }));
    if (enabled) setActivePlatformTab(platform);
  }

  function toggleAllGlobalAccounts(enabled: boolean) {
    const nextSelectedAccounts = PLATFORM_ORDER.reduce<SelectedAccountsMap>((acc, platform) => {
      acc[platform] = enabled ? accountsByPlatform[platform].map((account) => account.id) : [];
      return acc;
    }, createEmptySelectedAccounts());

    setSelectedAccounts(nextSelectedAccounts);
    setSelectedPlatforms(enabled ? PLATFORM_ORDER.filter((platform) => accountsByPlatform[platform].length > 0) : []);
    setExpandedPlatforms((current) =>
      PLATFORM_ORDER.reduce<Record<string, boolean>>((acc, platform) => {
        acc[platform] = enabled && accountsByPlatform[platform].length > 0;
        return acc;
      }, {}),
    );
  }

  function updatePlatformConfig<K extends keyof PlatformConfigMap[PlatformName]>(
    platform: PlatformName,
    key: K,
    value: PlatformConfigMap[PlatformName][K],
  ) {
    setPlatformConfigs((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        [key]: value,
      },
    }));
  }

  function applyAccountIds(accountIds: number[]) {
    const validIds = new Set(accounts.map((account) => account.id));
    const filteredIds = accountIds.filter((id) => validIds.has(id));

    const nextSelectedAccounts = PLATFORM_ORDER.reduce<SelectedAccountsMap>((acc, platform) => {
      acc[platform] = accountsByPlatform[platform]
        .filter((account) => filteredIds.includes(account.id))
        .map((account) => account.id);
      return acc;
    }, createEmptySelectedAccounts());

    setSelectedAccounts(nextSelectedAccounts);
    setSelectedPlatforms(
      PLATFORM_ORDER.filter((platform) => nextSelectedAccounts[platform].length > 0),
    );
    setExpandedPlatforms((current) =>
      PLATFORM_ORDER.reduce<Record<string, boolean>>((acc, platform) => {
        acc[platform] = nextSelectedAccounts[platform].length > 0 || current[platform] || false;
        return acc;
      }, {}),
    );
  }

  function handleSaveGroup() {
    const trimmedName = groupName.trim();
    const selectedIds = dedupeNumberList(
      PLATFORM_ORDER.flatMap((platform) => selectedAccounts[platform]),
    );

    if (!trimmedName) {
      setError("Give the account group a name before saving it.");
      return;
    }

    if (!selectedIds.length) {
      setError("Select at least one account before saving a group.");
      return;
    }

    const nextGroups = [
      ...accountGroups,
      { id: `${Date.now()}`, name: trimmedName, accountIds: selectedIds },
    ];

    setAccountGroups(nextGroups);
    writeSavedGroups(nextGroups);
    setGroupName("");
    setError(null);
    setMessage(`Saved "${trimmedName}" as an account group.`);
  }

  function handleApplyGroup(groupId: string) {
    const group = accountGroups.find((item) => item.id === groupId);
    if (!group) return;
    applyAccountIds(group.accountIds);
    setError(null);
    setMessage(`Applied "${group.name}".`);
  }

  function handleRemoveGroup(groupId: string) {
    const nextGroups = accountGroups.filter((group) => group.id !== groupId);
    setAccountGroups(nextGroups);
    writeSavedGroups(nextGroups);
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;

    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          if (altText.trim()) {
            formData.append("alt_text", altText.trim());
          }
          return uploadMedia(formData);
        }),
      );

      setMedia((current) => [...uploads, ...current]);
      setSelectedMediaIds((current) => dedupeNumberList([...uploads.map((asset) => asset.id), ...current]));
      setAltText("");
      setMessage(`${uploads.length} media file${uploads.length === 1 ? "" : "s"} uploaded.`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function applyAiAssist(mode: "tighten" | "cta" | "hashtags") {
    if (mode === "tighten") {
      const tightened = caption
        .replace(/\s+/g, " ")
        .split(". ")
        .map((segment) => segment.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(". ");
      setCaption(tightened || caption);
      return;
    }

    if (mode === "cta") {
      if (caption.toLowerCase().includes("learn more")) return;
      setCaption((current) =>
        `${current.trim()}${current.trim() ? "\n\n" : ""}Learn more and follow along for the next update.`,
      );
      return;
    }

    if (!caption.trim()) return;
    const suggestions = caption
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 4)
      .slice(0, 3)
      .map((token) => `#${token}`);
    const merged = dedupeStringList(
      `${hashtags}, ${suggestions.join(", ")}`
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    setHashtags(merged.join(", "));
  }

  async function handleSubmit() {
    if (!selectedPlatforms.length) {
      setError("Select at least one platform before creating the post.");
      return;
    }

    const missingAccounts = selectedPlatforms.find((platform) => !selectedAccounts[platform].length);
    if (missingAccounts) {
      setError(`Select at least one ${PLATFORM_LABELS[missingAccounts]} account before submitting.`);
      return;
    }

    const baseContent =
      caption.trim() || normalizeTagList(hashtags, "#") || normalizeTagList(mentions, "@");
    if (!baseContent && !selectedMediaIds.length) {
      setError("Add caption text or media before creating the post.");
      return;
    }

    for (const platform of selectedPlatforms) {
      const validationError = validatePlatformBeforeSubmit(platform, platformConfigs[platform]);
      if (validationError) {
        setError(validationError);
        setActivePlatformTab(platform);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      const requests = selectedPlatforms.flatMap((platform) =>
        selectedAccounts[platform].map((accountId) =>
          createPost({
            social_account_id: accountId,
            content: buildPlatformContent(caption, hashtags, mentions, platform, platformConfigs),
            scheduled_at: toUtcIsoString(platformConfigs[platform].schedule),
            media_ids: selectedMediaIds,
            platform_options: buildPlatformPayload(platform, platformConfigs[platform]),
          }),
        ),
      );

      await Promise.all(requests);
      setMessage(`${requests.length} post${requests.length === 1 ? "" : "s"} created successfully.`);
      setCaption("");
      setHashtags("");
      setMentions("");
      setSelectedMediaIds([]);
      setSelectedPlatforms([]);
      setSelectedAccounts(createEmptySelectedAccounts());
      setPlatformConfigs(createEmptyConfigs());
      setExpandedPlatforms({});
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create the post.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f2e8]">
        <div className="rounded-full border border-[#eadfcb] bg-white px-5 py-3 text-sm text-[#6f6558] shadow-[0_12px_30px_rgba(36,24,6,0.06)]">Loading composer...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_#fffdf8_0%,_#f7f2e8_55%,_#f0e7d8_100%)]">
      {/* Top notification bar */}
      {(message || error) && (
        <div className="px-6 pt-6">
          {message && (
            <div className="flex items-center gap-2 rounded-[18px] border border-[#cfe6c7] bg-[#f4fbf1] px-4 py-3 text-sm text-[#2d6d36] shadow-[0_12px_30px_rgba(36,24,6,0.04)]">
              <span>{message}</span>
              <button type="button" onClick={() => setMessage(null)} className="ml-auto text-green-400 hover:text-green-600">×</button>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-[18px] border border-[#ebc8c2] bg-[#fff5f3] px-4 py-3 text-sm text-[#9b3d2f] shadow-[0_12px_30px_rgba(36,24,6,0.04)]">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
            </div>
          )}
        </div>
      )}

      {/* 3-column layout — fills viewport height */}
      <div className="flex flex-1 gap-4 overflow-hidden px-4 pb-4 pt-4">

        {/* LEFT — Platforms & Accounts */}
        <div className="flex w-[272px] shrink-0 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Sidebar
              platforms={sidebarPlatforms}
              totalSelectedAccounts={totalSelectedAccounts}
              totalAccounts={totalAccounts}
              groupName={groupName}
              accountGroups={accountGroups}
              onGroupNameChange={setGroupName}
              onSaveGroup={handleSaveGroup}
              onApplyGroup={handleApplyGroup}
              onRemoveGroup={handleRemoveGroup}
              onSelectAll={toggleAllGlobalAccounts}
              onPlatformToggle={setPlatformEnabled}
              onSelectAllAccounts={toggleAllAccounts}
              onAccountToggle={toggleAccount}
            />
          </div>
        </div>

        {/* CENTER — Post Editor */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Center header */}
          <div className="mb-3 rounded-[26px] border border-[#eadfcb] bg-white px-5 py-4 shadow-[0_14px_36px_rgba(36,24,6,0.05)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">Compose Workspace</p>
              <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.03em] text-[#1f170c]">Create your post</h1>
              <p className="mt-1.5 text-[13px] text-[#6f6558]">Write once, publish everywhere with cleaner per-platform controls.</p>
            </div>
          </div>

          {/* Selected platform chips */}
          {selectedPlatforms.length > 0 && (
            <div className="mb-3 flex items-center gap-2 overflow-x-auto rounded-[20px] border border-[#eadfcb] bg-white px-4 py-3 shadow-[0_14px_36px_rgba(36,24,6,0.04)]">
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8d8274]">Platforms ({selectedPlatforms.length})</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPlatforms.map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center gap-1.5 rounded-full border border-[#eadfcb] bg-[#fffaf2] px-2.5 py-1 text-[11px] font-medium text-[#352819]"
                  >
                    <PlatformLogo platform={platform} className="h-3.5 w-3.5" />
                    <button
                      type="button"
                      onClick={() => setPlatformEnabled(platform, false)}
                      className="ml-0.5 text-[#9d917d] hover:text-[#6f5316]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
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
              onMediaSelectionToggle={(mediaId, enabled) =>
                setSelectedMediaIds((current) =>
                  enabled ? dedupeNumberList([...current, mediaId]) : current.filter((id) => id !== mediaId),
                )
              }
              onFilesSelected={handleFilesSelected}
              onPreviewToggle={() => setPreviewEnabled((current) => !current)}
              onAiPanelToggle={() => setAiPanelOpen((current) => !current)}
              onApplyAiAssist={applyAiAssist}
            />
          </div>
        </div>

        {/* RIGHT — Platform Settings */}
        <div className="flex w-[312px] shrink-0 flex-col overflow-hidden rounded-[26px] border border-[#eadfcb] bg-white shadow-[0_14px_36px_rgba(36,24,6,0.05)]">
          <PlatformSettings
            selectedPlatforms={selectedPlatforms}
            selectedAccounts={selectedAccounts}
            platformConfigs={platformConfigs}
            accountsByPlatform={accountsByPlatform}
            expandedPlatforms={expandedPlatforms}
            activePlatformTab={activePlatformTab}
            onTabChange={setActivePlatformTab}
            onToggleExpand={(platform) =>
              setExpandedPlatforms((current) => ({
                ...current,
                [platform]: !(current[platform] ?? true),
              }))
            }
            onConfigChange={updatePlatformConfig}
          />
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="border-t border-[#eadfcb] bg-white/70 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-[16px] border border-[#decdaa] bg-white px-4 py-2.5 text-sm font-medium text-[#4b3f2f] transition hover:bg-[#fcf7ee]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="flex items-center gap-2 rounded-[16px] bg-[#1f170c] px-5 py-2.5 text-sm font-semibold text-[#f6d48f] shadow-[0_18px_40px_rgba(31,23,12,0.18)] transition hover:bg-[#130d05] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Review & publish"}
            {!submitting && (
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
