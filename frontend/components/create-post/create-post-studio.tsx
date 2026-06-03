"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PendingApprovalBanner, useSessionState } from "@/components/session-state";

import {
  PLATFORM_META,
  PLATFORM_ORDER,
  createDefaultPlatformConfig,
  PLATFORM_LABELS,
} from "@/components/create-post/constants";
import { PlatformSettings } from "@/components/create-post/platform-settings";
import { MediaEditModal } from "@/components/create-post/media-edit-modal";
import { PostEditor } from "@/components/create-post/post-editor";
import { Sidebar } from "@/components/create-post/sidebar";
import { buildDraftContent, getPlatformValidation } from "@/components/create-post/validation";
import { PlatformLogo } from "@/components/platform-logo";

import {
  PlatformConfigMap,
  SelectedAccountsMap,
} from "@/components/create-post/types";

import {
  createPost,
  fetchAccounts,
  uploadMedia,
  uploadMediaWithProgress,
} from "@/lib/api";
import { Account, MediaAsset, PlatformName } from "@/lib/types";

/* ---------------- HELPERS ---------------- */

/**
 * Transforms a raw PlatformConfig (frontend camelCase keys) into the
 * backend-expected platform_options shape for each platform.
 *
 * The backend reads e.g. options.get("title"), options.get("privacyStatus"),
 * so keys must match what publish_to_youtube / publish_to_linkedin etc. expect.
 */
function buildPlatformOptions(platform: PlatformName, cfg: import("@/components/create-post/types").PlatformConfig): Record<string, unknown> {
  switch (platform) {
    case "youtube":
      return {
        youtube: {
          title: cfg.youtubeTitle || null,
          privacyStatus: cfg.youtubePrivacy,
          categoryId: cfg.youtubeCategoryId || null,
          tags: cfg.youtubeTags
            ? cfg.youtubeTags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
          notifySubscribers: cfg.youtubeNotifySubscribers,
          embeddable: cfg.youtubeEmbeddable,
          license: cfg.youtubeLicense,
          madeForKids: cfg.youtubeMadeForKids,
          defaultLanguage: cfg.youtubeLanguage || null,
        },
      };
    case "facebook":
      return {
        facebook: {
          visibility: cfg.facebookVisibility,
        },
      };
    case "instagram":
      return {
        instagram: {
          caption_mode: cfg.instagramPostType === "reel" ? "reel" : undefined,
          first_comment: cfg.instagramFirstCommentEnabled
            ? cfg.instagramFirstComment || null
            : null,
        },
      };
    case "linkedin":
      return {
        linkedin: {
          visibility: cfg.linkedinAudience,
        },
      };
    case "twitter":
      return {
        twitter: {
          reply_settings: cfg.twitterReplySettings,
        },
      };
    case "blogger":
      return {
        blogger: {
          title: cfg.bloggerTitle || null,
          labels: cfg.bloggerLabels
            ? cfg.bloggerLabels.split(",").map((l) => l.trim()).filter(Boolean)
            : [],
          isDraft: cfg.bloggerIsDraft,
        },
      };
    case "google_business":
      return {
        google_business: {
          topicType: cfg.googleBusinessTopicType,
          callToActionUrl: cfg.googleBusinessCtaUrl || null,
          actionType: cfg.googleBusinessCta !== "NONE" ? cfg.googleBusinessCta : null,
        },
      };
    case "wordpress":
      return {
        wordpress: {
          title: cfg.wordpressTitle || null,
          status: cfg.wordpressStatus,
          excerpt: cfg.wordpressExcerpt || null,
        },
      };
    default:
      return { [platform]: {} };
  }
}

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

/* ---------------- TYPES ---------------- */

type PostResult = {
  platform: PlatformName;
  accountName: string;
  accountId: number;
  status: "success" | "error";
  scheduledAt?: string | null;
  postId?: number;
  postUrl?: string;
  error?: string;
};

type PublishJob = {
  platform: PlatformName;
  accountId: number;
  accountName: string;
  cfg: import("@/components/create-post/types").PlatformConfig;
  scheduledAt: string | null;
};

type UploadProgressItem = {
  id: string;
  name: string;
  size: number;
  percent: number | null;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
};

function scheduleKey(platform: PlatformName, accountId: number) {
  return `${platform}:${accountId}`;
}

function formatScheduleLabel(value?: string | null) {
  if (!value) {
    return "Publish now";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toIsoOrNull(value?: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

/* ---------------- COMPONENT ---------------- */

export function CreatePostStudio() {
  const router = useRouter();
  const { isPendingApproval } = useSessionState();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const [editedMediaIds, setEditedMediaIds] = useState<number[]>([]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);
  const [selectedAccounts, setSelectedAccounts] =
    useState<SelectedAccountsMap>(createEmptySelectedAccounts);

  const [platformConfigs, setPlatformConfigs] =
    useState<PlatformConfigMap>(createEmptyConfigs);

  /* ✅ GROUP STATE */
  const [groupName, setGroupName] = useState("");
  const [accountGroups, setAccountGroups] = useState<
    { id: string; name: string; accountIds: number[] }[]
  >([]);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");

  const [loading, setLoading] = useState(true);
  const [mobileTab, setMobileTab] = useState<"accounts" | "compose" | "settings">("accounts");

  const [activePlatformTab, setActivePlatformTab] =
    useState<PlatformName | null>(null);

  /* ---------------- SUBMIT STATE ---------------- */
  const [submitting, setSubmitting] = useState(false);
  const [resultsModal, setResultsModal] = useState<PostResult[] | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [accountSchedules, setAccountSchedules] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgressItems, setUploadProgressItems] = useState<UploadProgressItem[]>([]);
  const [mediaEditorAsset, setMediaEditorAsset] = useState<MediaAsset | null>(null);
  const [savingEditedMedia, setSavingEditedMedia] = useState(false);
  const [highlightedFixTargetId, setHighlightedFixTargetId] = useState<string | null>(null);

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAccounts();
        setAccounts(data.filter((a) => a.is_active));
      } catch (err) {
        console.error("Failed to load accounts:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------- MEDIA ---------------- */

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;

    const upload = async () => {
      const items = selectedFiles.map((file, index) => ({
        id: `${Date.now()}-${index}-${file.name}`,
        name: file.name,
        size: file.size,
        percent: 0,
        status: "uploading" as const,
      }));

      try {
        setUploadError(null);
        setUploadProgressItems((current) => [...items, ...current]);
        const uploaded = await Promise.all(
          selectedFiles.map((file, index) => {
            const itemId = items[index].id;
            const fd = new FormData();
            fd.append("file", file);
            return uploadMediaWithProgress(fd, (progress) => {
              setUploadProgressItems((current) =>
                current.map((item) =>
                  item.id === itemId
                    ? {
                        ...item,
                        percent: progress.percent,
                        status: progress.percent === 100 ? "processing" : "uploading",
                      }
                    : item,
                ),
              );
            }).then((asset) => {
              setUploadProgressItems((current) =>
                current.map((item) =>
                  item.id === itemId
                    ? { ...item, percent: 100, status: "complete" }
                    : item,
                ),
              );
              window.setTimeout(() => {
                setUploadProgressItems((current) =>
                  current.filter((item) => item.id !== itemId),
                );
              }, 1200);
              return asset;
            });
          })
        );

        setMedia((current) => [...uploaded, ...current]);
        setSelectedMediaIds((current) => [
          ...uploaded.map((item) => item.id),
          ...current.filter((id) => !uploaded.some((item) => item.id === id)),
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        setUploadError(message);
        setUploadProgressItems((current) =>
          current.map((item) =>
            item.status === "uploading" || item.status === "processing"
              ? { ...item, status: "error", error: message }
              : item,
          ),
        );
      }
    };

    upload();
  };

  const toggleMedia = (id: number) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleOpenMediaEditor = (asset: MediaAsset) => {
    setMediaEditorAsset(asset);
    setUploadError(null);
  };

  const handleSaveEditedMedia = async ({
    blob,
    altText: nextAltText,
    fileName,
    mimeType,
  }: {
    blob: Blob;
    altText: string;
    fileName: string;
    mimeType: string;
  }) => {
    if (!mediaEditorAsset) {
      return;
    }

    setSavingEditedMedia(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", new File([blob], fileName, { type: mimeType }));
      if (nextAltText) {
        formData.append("alt_text", nextAltText);
      }

      const uploaded = await uploadMedia(formData);

      setMedia((current) => [uploaded, ...current]);
      setSelectedMediaIds((current) => {
        const withoutOriginal = current.filter((id) => id !== mediaEditorAsset.id);
        return [uploaded.id, ...withoutOriginal.filter((id) => id !== uploaded.id)];
      });
      setEditedMediaIds((current) =>
        current.includes(uploaded.id) ? current : [uploaded.id, ...current]
      );
      setMediaEditorAsset(null);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Unable to save edited media.",
      );
    } finally {
      setSavingEditedMedia(false);
    }
  };

  /* ---------------- PLATFORM ---------------- */

  const handlePlatformToggle = (platform: PlatformName, enabled?: boolean) => {
    const platformAccounts = accountsByPlatform[platform];
    if (platformAccounts.length === 0) {
      setUploadError(`Connect a ${PLATFORM_LABELS[platform]} account before selecting this platform.`);
      return;
    }

    setSelectedPlatforms((prev) => {
      const isSelected = prev.includes(platform);
      const shouldEnable = enabled !== undefined ? enabled : !isSelected;
      if (shouldEnable && !isSelected) {
        setActivePlatformTab(platform);
        setSelectedAccounts((current) => ({
          ...current,
          [platform]: current[platform].length
            ? current[platform]
            : platformAccounts.map((account) => account.id),
        }));
        return [...prev, platform];
      }
      if (!shouldEnable && isSelected) {
        setSelectedAccounts((current) => ({
          ...current,
          [platform]: [],
        }));
        return prev.filter((p) => p !== platform);
      }
      return prev;
    });
  };

  const handleSelectAll = (enabled: boolean) => {
    if (!enabled) {
      setSelectedPlatforms([]);
      setSelectedAccounts(createEmptySelectedAccounts());
      return;
    }

    const platformsWithAccounts = PLATFORM_ORDER.filter(
      (platform) => accountsByPlatform[platform].length > 0
    );

    setSelectedPlatforms(platformsWithAccounts);
    setSelectedAccounts(() => {
      const next = createEmptySelectedAccounts();
      for (const platform of platformsWithAccounts) {
        next[platform] = accountsByPlatform[platform].map((account) => account.id);
      }
      return next;
    });

    if (platformsWithAccounts.length > 0) {
      setActivePlatformTab(platformsWithAccounts[0]);
    }
  };

  const handleSelectAllAccounts = (
    platform: PlatformName,
    enabled: boolean
  ) => {
    const accs = accountsByPlatform[platform];
    if (accs.length === 0) {
      setUploadError(`Connect a ${PLATFORM_LABELS[platform]} account before selecting this platform.`);
      return;
    }

    setSelectedAccounts((prev) => ({
      ...prev,
      [platform]: enabled ? accs.map((a) => a.id) : [],
    }));

    setSelectedPlatforms((prev) => {
      if (enabled) {
        return prev.includes(platform) ? prev : [...prev, platform];
      }
      return prev.filter((item) => item !== platform);
    });

    if (enabled) {
      setActivePlatformTab(platform);
    }
  };

  const handleAccountToggle = (
    platform: PlatformName,
    accountId: number,
    enabled: boolean
  ) => {
    setSelectedAccounts((prev) => {
      const current = prev[platform];
      const next = enabled
        ? current.includes(accountId)
          ? current
          : [...current, accountId]
        : current.filter((id) => id !== accountId);

      setSelectedPlatforms((platforms) => {
        if (next.length > 0) {
          return platforms.includes(platform) ? platforms : [...platforms, platform];
        }
        return platforms.filter((item) => item !== platform);
      });

      if (next.length > 0) {
        setActivePlatformTab(platform);
      }

      return {
        ...prev,
        [platform]: next,
      };
    });
  };

  /* ---------------- GROUP LOGIC ---------------- */

  const handleSaveGroup = () => {
    if (!groupName.trim()) return;

    const selectedIds = Object.values(selectedAccounts).flat();
    if (selectedIds.length === 0) return;

    setAccountGroups((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: groupName,
        accountIds: selectedIds,
      },
    ]);

    setGroupName("");
  };

  const handleApplyGroup = (groupId: string) => {
    const group = accountGroups.find((g) => g.id === groupId);
    if (!group) return;

    const newSelected = createEmptySelectedAccounts();
    const newPlatforms: PlatformName[] = [];

    for (const platform of PLATFORM_ORDER) {
      const accs = accountsByPlatform[platform];

      const matched = accs
        .filter((a) => group.accountIds.includes(a.id))
        .map((a) => a.id);

      if (matched.length) {
        newSelected[platform] = matched;
        newPlatforms.push(platform);
      }
    }

    setSelectedAccounts(newSelected);
    setSelectedPlatforms(newPlatforms);
  };

  const handleRemoveGroup = (groupId: string) => {
    setAccountGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  /* ---------------- SUBMIT ---------------- */

  const buildSelectedJobs = (mode: "publish" | "schedule"): PublishJob[] =>
    selectedPlatformList.flatMap((platform) =>
      selectedAccounts[platform].map((accountId) => {
        const cfg = platformConfigs[platform];
        const account = accountsByPlatform[platform].find(
          (a) => a.id === accountId
        );
        const scheduledAt =
          mode === "schedule"
            ? toIsoOrNull(accountSchedules[scheduleKey(platform, accountId)])
            : null;

        return {
          platform,
          accountId,
          accountName: account?.account_name ?? `Account ${accountId}`,
          cfg,
          scheduledAt,
        };
      })
    );

  const openScheduleModal = () => {
    if (selectedPlatformList.length === 0) return;
    if (blockingValidationItems.length > 0) {
      setUploadError(blockingValidationItems[0].message);
      return;
    }
    setScheduleModalOpen(true);
  };

  const handleSubmit = async (mode: "publish" | "schedule" = "publish") => {
    if (selectedPlatformList.length === 0) return;
    if (blockingValidationItems.length > 0) {
      setUploadError(blockingValidationItems[0].message);
      return;
    }

    const content = draftContent;

    setSubmitting(true);

    const jobs = buildSelectedJobs(mode);

    const results: PostResult[] = await Promise.all(
      jobs.map(async ({ platform, accountId, accountName, cfg, scheduledAt }) => {
        try {
          const res = await createPost({
            social_account_id: accountId,
            content,
            scheduled_at: scheduledAt,
            media_ids: selectedMediaIds,
            platform_options: buildPlatformOptions(platform, cfg),
          });
          return {
            platform,
            accountId,
            accountName,
            status: "success" as const,
            scheduledAt,
            postId: res.post_id,
          };
        } catch (err) {
          return {
            platform,
            accountId,
            accountName,
            status: "error" as const,
            scheduledAt,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      })
    );

    setSubmitting(false);
    setScheduleModalOpen(false);
    setResultsModal(results);
  };

  /* ---------------- DERIVED ---------------- */

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_ORDER.reduce((acc, p) => {
      acc[p] = accounts.filter((a) => a.platform?.toLowerCase() === p);
      return acc;
    }, {} as Record<PlatformName, Account[]>);
  }, [accounts]);

  const selectedAssets = useMemo(
    () => media.filter((asset) => selectedMediaIds.includes(asset.id)),
    [media, selectedMediaIds]
  );

  const draftContent = useMemo(
    () => buildDraftContent(caption, hashtags, mentions),
    [caption, hashtags, mentions]
  );

  const selectedPlatformList = useMemo(
    () =>
      PLATFORM_ORDER.filter(
        (platform) =>
          selectedPlatforms.includes(platform) &&
          selectedAccounts[platform].length > 0
      ),
    [selectedAccounts, selectedPlatforms]
  );

  const platformValidation = useMemo(
    () =>
      selectedPlatformList.reduce((acc, platform) => {
        acc[platform] = getPlatformValidation(
          platform,
          platformConfigs[platform],
          selectedAssets,
          draftContent
        );
        return acc;
      }, {} as Record<PlatformName, ReturnType<typeof getPlatformValidation>>),
    [draftContent, platformConfigs, selectedAssets, selectedPlatformList]
  );

  const blockingValidationItems = useMemo(
    () =>
      selectedPlatformList
        .filter((platform) => !platformValidation[platform]?.valid)
        .map((platform) => ({
          platform,
          label: PLATFORM_LABELS[platform],
          message: platformValidation[platform].message,
          fixTarget: platformValidation[platform].fixTarget,
        })),
    [platformValidation, selectedPlatformList]
  );

  const jumpToValidationFix = (item: (typeof blockingValidationItems)[number]) => {
    const fixTarget = item.fixTarget;
    if (!fixTarget) {
      return;
    }

    setActivePlatformTab(item.platform);
    setMobileTab(fixTarget.panel);
    const targetId = fixTarget.fieldId ?? fixTarget.sectionId;
    setHighlightedFixTargetId(targetId);

    window.setTimeout(() => {
      const target = document.getElementById(targetId) ?? document.getElementById(fixTarget.sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLSelectElement ||
          target instanceof HTMLButtonElement
        ) {
          target.focus({ preventScroll: true });
        }
      }
    }, 180);

    window.setTimeout(() => {
      setHighlightedFixTargetId((current) => (current === targetId ? null : current));
    }, 2400);
  };

  const openComposeAtCaption = () => {
    setMobileTab("compose");
    setHighlightedFixTargetId("post-caption");

    window.setTimeout(() => {
      const caption = document.getElementById("post-caption");
      const section = document.getElementById("compose-caption");
      const target = caption ?? section;
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (caption instanceof HTMLTextAreaElement) {
        caption.focus({ preventScroll: true });
      }
    }, 220);

    window.setTimeout(() => {
      setHighlightedFixTargetId((current) => (current === "post-caption" ? null : current));
    }, 2200);
  };

  const sidebarPlatforms = useMemo(
    () =>
      PLATFORM_ORDER.map((p) => ({
        ...PLATFORM_META[p],
        accounts: accountsByPlatform[p],
        selectedAccountIds: selectedAccounts[p],
        selected: selectedPlatforms.includes(p),
      })),
    [accountsByPlatform, selectedAccounts, selectedPlatforms]
  );

  const totalSelectedAccounts = Object.values(selectedAccounts).flat().length;
  const schedulePreviewJobs = buildSelectedJobs("schedule");
  const scheduledPreviewCount = schedulePreviewJobs.filter((job) => job.scheduledAt).length;
  const canSubmit =
    totalSelectedAccounts > 0 &&
    !isPendingApproval &&
    !submitting &&
    blockingValidationItems.length === 0;

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden pb-[4.5rem] sm:pb-[5rem] lg:pb-0">
      <div className="shrink-0 px-3 pt-3 md:px-5 md:pt-4">
        <PendingApprovalBanner compact />
      </div>

      {/* MOBILE TAB BAR — hidden on desktop */}
      <div className="flex shrink-0 border-b bg-white md:hidden">
        {(["accounts", "compose", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`min-w-0 flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
              mobileTab === tab
                ? "border-b-2 border-[#ffd52a] text-[#8c6f00]"
                : "text-ink-500"
            }`}
          >
            {tab === "accounts"
              ? "Accounts"
              : tab === "compose"
              ? "Compose"
              : "Settings"}
            {tab === "accounts" && totalSelectedAccounts > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#ffd52a] text-[10px] font-bold text-ink-900">
                {totalSelectedAccounts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* PANELS */}
      <div className="min-h-0 flex-1 overflow-hidden md:flex md:flex-row">

        {/* LEFT — Accounts */}
        <div
          className={`h-full min-h-0 w-full overflow-y-auto bg-white md:w-[260px] md:border-r ${
            mobileTab === "accounts" ? "block" : "hidden md:block"
          }`}
        >
          <Sidebar
            platforms={sidebarPlatforms}
            totalSelectedAccounts={totalSelectedAccounts}
            totalAccounts={accounts.length}
            groupName={groupName}
            accountGroups={accountGroups}
            onGroupNameChange={setGroupName}
            onSaveGroup={handleSaveGroup}
            onApplyGroup={handleApplyGroup}
            onRemoveGroup={handleRemoveGroup}
            onSelectAll={handleSelectAll}
            onPlatformToggle={handlePlatformToggle}
            onSelectAllAccounts={handleSelectAllAccounts}
            onAccountToggle={handleAccountToggle}
            setMobileTab={setMobileTab}
            onContinueToCompose={openComposeAtCaption}
            onManageAccounts={() => router.push("/connections")}
          />
        </div>

        {/* CENTER — Compose */}
        <div
          className={`h-full min-h-0 w-full flex-col overflow-y-auto bg-white md:flex-1 ${
            mobileTab === "compose" ? "flex" : "hidden md:flex"
          }`}
        >
          <PostEditor
            caption={caption}
            hashtags={hashtags}
            mentions={mentions}
            media={media}
            selectedMediaIds={selectedMediaIds}
            editedMediaIds={editedMediaIds}
            selectedPlatforms={selectedPlatforms}
            editingMediaId={mediaEditorAsset?.id ?? null}
            highlightedFixTargetId={highlightedFixTargetId}
            onCaptionChange={setCaption}
            onHashtagsChange={setHashtags}
            onMentionsChange={setMentions}
            onMediaSelectionToggle={toggleMedia}
            onFilesSelected={handleFilesSelected}
            onEditMedia={handleOpenMediaEditor}
            uploadError={uploadError}
            uploadProgressItems={uploadProgressItems}
          />
        </div>

        {/* RIGHT — Settings */}
        <div
          className={`h-full min-h-0 w-full overflow-y-auto bg-white md:w-[300px] md:border-l ${
            mobileTab === "settings" ? "block" : "hidden md:block"
          }`}
        >
          <PlatformSettings
            selectedPlatforms={selectedPlatforms}
            platformConfigs={platformConfigs}
            activePlatformTab={activePlatformTab}
            highlightedFixTargetId={highlightedFixTargetId}
            onTabChange={setActivePlatformTab}
            onConfigChange={(platform, key, value) =>
              setPlatformConfigs((prev) => ({
                ...prev,
                [platform]: { ...prev[platform], [key]: value },
              }))
            }
          />
        </div>

      </div>

      <MediaEditModal
        asset={mediaEditorAsset}
        open={Boolean(mediaEditorAsset)}
        saving={savingEditedMedia}
        selectedPlatforms={selectedPlatforms}
        onClose={() => {
          if (!savingEditedMedia) {
            setMediaEditorAsset(null);
          }
        }}
        onSave={handleSaveEditedMedia}
      />

      {/* POST BUTTON BAR */}
      <div className="order-2 flex shrink-0 flex-col gap-1.5 border-t border-[#eadfcb] bg-[#fffef9] px-2.5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-4px_18px_rgba(180,144,34,0.08)] sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:px-5 sm:py-3 md:pb-[calc(0.375rem+env(safe-area-inset-bottom))]">
        <div className="min-w-0 truncate text-[10px] leading-4 text-[#9b7b3f] sm:text-xs">
          {blockingValidationItems.length > 0
            ? `${blockingValidationItems.length} platform requirement${
                blockingValidationItems.length === 1 ? "" : "s"
              } still need attention`
            : totalSelectedAccounts > 0
            ? `Publishing to ${totalSelectedAccounts} account${
                totalSelectedAccounts !== 1 ? "s" : ""
              } across ${selectedPlatforms.length} platform${
                selectedPlatforms.length !== 1 ? "s" : ""
              }`
            : accounts.length === 0
            ? "Connect a social account before publishing"
            : "Select accounts to publish"}
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row">
        <motion.button
          type="button"
          onClick={openScheduleModal}
          disabled={!canSubmit}
          whileHover={{ scale: submitting ? 1 : 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[#eadba6] bg-white px-3 py-2 text-xs font-bold text-[#6f5415] transition-all hover:bg-[#fff8e6] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:w-auto sm:gap-2.5 sm:px-5 sm:py-2.5 sm:text-sm"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v5l3 2" />
          </svg>
          Schedule
        </motion.button>
        <motion.button
          type="button"
          onClick={() => void handleSubmit("publish")}
          disabled={!canSubmit}
          whileHover={{ scale: submitting ? 1 : 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[#ffd52a] px-3 py-2 text-xs font-bold text-[#09090e] shadow-[0_6px_18px_rgba(255,213,42,0.28)] transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:w-auto sm:gap-2.5 sm:px-7 sm:py-2.5 sm:text-sm"
        >
          {submitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#09090e] border-t-transparent" />
              Publishing…
            </>
          ) : (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {isPendingApproval ? "Activation required" : "Publish"}
            </>
          )}
        </motion.button>
        </div>
      </div>

      {isPendingApproval ? (
        <div className="order-3 max-h-[18dvh] shrink-0 overflow-y-auto border-t border-[#f1dacd] bg-[#fff8f2] px-3 py-2 sm:max-h-none sm:px-5 sm:py-4">
          <div className="rounded-xl border border-[#f0d2ca] bg-white px-3 py-2 text-xs leading-5 text-[#7c3f36] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <span className="font-semibold text-[#5b271f]">Publishing locked:</span> Account activation is required before connecting accounts or publishing.
          </div>
        </div>
      ) : blockingValidationItems.length > 0 && (
        <div className="order-3 max-h-[18dvh] shrink-0 overflow-y-auto border-t border-[#f1dacd] bg-[#fff8f2] px-3 py-2 sm:max-h-none sm:px-5 sm:py-4">
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b25a4f] sm:mb-2 sm:text-xs sm:tracking-[0.2em]">
            Fix Before Publishing
          </div>
          <div className="grid gap-1.5 sm:gap-2">
            {blockingValidationItems.map((item) => (
              <div
                key={item.platform}
                className="rounded-xl border border-[#f0d2ca] bg-white px-3 py-2 text-xs leading-5 text-[#7c3f36] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <div className="min-w-0 break-words">
                    <span className="font-semibold text-[#5b271f]">{item.label}:</span>{" "}
                    {item.message}
                  </div>
                  {item.fixTarget ? (
                    <button
                      type="button"
                      onClick={() => jumpToValidationFix(item)}
                      className="shrink-0 rounded-full border border-[#f0d2ca] bg-[#fff8f2] px-3 py-1.5 text-xs font-semibold text-[#9f4035] transition-colors hover:bg-[#fff1ea] sm:w-auto"
                    >
                      {item.fixTarget.actionLabel}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      <AnimatePresence>
        {scheduleModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", damping: 24, stiffness: 260 }}
              className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-[#e8dbc5] bg-[#fffdf8] shadow-[0_28px_80px_rgba(31,23,12,0.28)] sm:max-h-[92dvh] sm:rounded-[24px]"
            >
              <div className="shrink-0 border-b border-[#eadfcb] px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-[#171311]">Schedule selected accounts</h2>
                    <p className="mt-1 text-xs leading-5 text-[#8b7654]">
                      Leave a row blank to publish immediately. Only rows with a time will be scheduled.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#eadfcb] bg-white text-[#8b7654] transition-colors hover:bg-[#fff7e6]"
                    aria-label="Close schedule modal"
                  >
                    x
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3 sm:px-5">
                {schedulePreviewJobs.map((job) => {
                  const key = scheduleKey(job.platform, job.accountId);
                  return (
                    <div
                      key={key}
                      className="grid gap-3 rounded-2xl border border-[#eadfcb] bg-white px-3 py-3 shadow-sm sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fff4d8]">
                          <PlatformLogo platform={job.platform} className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#171311]">
                            {job.accountName}
                          </div>
                          <div className="text-[11px] font-medium text-[#9b7b3f]">
                            {PLATFORM_LABELS[job.platform]} - {job.scheduledAt ? "Scheduled" : "Publish now"}
                          </div>
                        </div>
                      </div>
                      <input
                        type="datetime-local"
                        value={accountSchedules[key] ?? ""}
                        onChange={(event) =>
                          setAccountSchedules((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                        className="h-10 min-w-0 w-full rounded-xl border border-[#eadba6] bg-[#fffef9] px-3 text-xs text-[#2a2116] focus:border-[#d4a94f] focus:ring-2 focus:ring-[#d4a94f]/30"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAccountSchedules((current) => {
                            const next = { ...current };
                            delete next[key];
                            return next;
                          })
                        }
                        className="w-full rounded-full border border-[#eadfcb] px-3 py-2 text-xs font-semibold text-[#8b7654] transition-colors hover:bg-[#fff7e6] sm:w-auto"
                      >
                        Clear
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="shrink-0 border-t border-[#eadfcb] bg-[#fff8ea] px-4 py-3 sm:px-5">
                <div className="mb-3 text-xs leading-5 text-[#8b7654]">
                  {scheduledPreviewCount > 0
                    ? `${scheduledPreviewCount} account${scheduledPreviewCount === 1 ? "" : "s"} scheduled. The rest will publish immediately.`
                    : "No schedule times set. Confirming will publish every selected account immediately."}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setScheduleModalOpen(false)}
                    className="w-full rounded-full border border-[#eadfcb] bg-white px-5 py-2.5 text-sm font-semibold text-[#6f5415] transition-colors hover:bg-[#fff7e6] sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSubmit("schedule")}
                    disabled={submitting}
                    className="w-full rounded-full bg-[#ffd52a] px-6 py-2.5 text-sm font-bold text-[#09090e] shadow-[0_6px_22px_rgba(255,213,42,0.28)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Submitting..." : "Confirm publish plan"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RESULTS MODAL */}
      <AnimatePresence>
        {resultsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="relative flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-[#0d1018] shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:h-auto sm:max-h-[90dvh] sm:rounded-[28px] sm:border sm:border-[#1e2535]"
            >
              {(() => {
                const successCount = resultsModal.filter(
                  (r) => r.status === "success"
                ).length;
                const errorCount = resultsModal.filter(
                  (r) => r.status === "error"
                ).length;
                const scheduledCount = resultsModal.filter(
                  (r) => r.status === "success" && r.scheduledAt
                ).length;
                const allOk = errorCount === 0;
                return (
                  <>
                    {/* Header */}
                    <div
                      className={`px-6 py-5 ${
                        allOk
                          ? "bg-gradient-to-r from-[#0f2a14] to-[#0d1e10]"
                          : "bg-gradient-to-r from-[#2a0f0e] to-[#1a0d10]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                              allOk
                                ? "bg-[#ffd52a]/18 text-[#ffd52a]"
                                : "bg-[#ff6b5b]/20 text-[#ff6b5b]"
                            }`}
                          >
                            {allOk ? "✓" : "!"}
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-white">
                              {allOk
                                ? scheduledCount > 0
                                  ? "Publish plan submitted!"
                                  : "Posts published!"
                                : errorCount === resultsModal.length
                                ? "Publishing failed"
                                : "Partially published"}
                            </h2>
                            <p className="mt-0.5 text-xs text-[#8a9ab5]">
                              {successCount > 0 && `${successCount} succeeded`}
                              {successCount > 0 && errorCount > 0 && " · "}
                              {errorCount > 0 && `${errorCount} failed`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResultsModal(null)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Results list */}
                    <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-4 sm:max-h-[380px]">
                      {resultsModal.map((result, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 rounded-[16px] border p-3.5 ${
                            result.status === "success"
                              ? "border-[#4b3f17] bg-[#211d08]"
                              : "border-[#3a1a1a] bg-[#1f0d0d]"
                          }`}
                        >
                          <PlatformLogo
                            platform={result.platform}
                            className="mt-0.5 h-5 w-5 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-semibold text-white">
                                {result.accountName}
                              </span>
                              <span
                                className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  result.status === "success"
                                    ? "bg-[#ffd52a]/16 text-[#ffd52a]"
                                    : "bg-[#ff6b5b]/15 text-[#ff6b5b]"
                                }`}
                              >
                                {result.status === "success"
                                  ? result.scheduledAt
                                    ? "Scheduled"
                                    : "Published"
                                  : "Failed"}
                              </span>
                            </div>
                            {result.status === "error" && result.error && (
                              <p className="mt-1 text-xs leading-relaxed text-[#ff9b8d]">
                                {result.error}
                              </p>
                            )}
                            {result.status === "success" && (
                              <div className="mt-1.5 flex items-center gap-3">
                                {result.postId && (
                                  <span className="text-[11px] text-[#a9975a]">
                                    Post #{result.postId}
                                  </span>
                                )}
                                <span className="text-[11px] text-[#a9975a]">
                                  {formatScheduleLabel(result.scheduledAt)}
                                </span>
                                {result.postUrl && (
                                  <a
                                    href={result.postUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#ffd52a] transition-colors hover:text-[#ffe566]"
                                  >
                                    View live post
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                    >
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                      <polyline points="15 3 21 3 21 9" />
                                      <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                  </a>
                                )}
                                <a
                                  href="/posts"
                                  className="inline-flex items-center gap-1 text-[11px] text-[#6a8aaa] transition-colors hover:text-[#93b8d8]"
                                >
                                  View in scheduled posts →
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-3 border-t border-[#1a2030] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href="/posts"
                        className="text-xs font-medium text-[#6a8aaa] transition-colors hover:text-[#93b8d8]"
                      >
                        View all scheduled posts →
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setResultsModal(null);
                          if (resultsModal.some((r) => r.status === "success")) {
                            setCaption("");
                            setHashtags("");
                            setMentions("");
                            setSelectedMediaIds([]);
                            setSelectedPlatforms([]);
                            setSelectedAccounts(createEmptySelectedAccounts());
                            setAccountSchedules({});
                          }
                        }}
                        className="w-full rounded-full bg-[#ffd52a] px-5 py-2 text-sm font-bold text-[#09090e] shadow-[0_4px_14px_rgba(255,213,42,0.3)] transition-colors hover:bg-[#ffe566] sm:w-auto"
                      >
                        {resultsModal.every((r) => r.status === "success")
                          ? "Done"
                          : "Close"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
