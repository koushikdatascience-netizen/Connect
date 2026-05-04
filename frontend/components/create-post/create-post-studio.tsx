"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import {
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
  SelectedAccountsMap,
} from "@/components/create-post/types";

import { fetchAccounts, uploadMedia, createPost } from "@/lib/api";
import { Account, MediaAsset, PlatformName } from "@/lib/types";

/* ---------------- HELPERS ---------------- */

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
  postId?: number;
  postUrl?: string;
  error?: string;
};

/* ---------------- COMPONENT ---------------- */

export function CreatePostStudio() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);

  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformName[]>([]);
  const [selectedAccounts, setSelectedAccounts] =
    useState<SelectedAccountsMap>(createEmptySelectedAccounts);

  const [platformConfigs, setPlatformConfigs] =
    useState<PlatformConfigMap>(createEmptyConfigs);

  /* GROUP STATE */
  const [groupName, setGroupName] = useState("");
  const [accountGroups, setAccountGroups] = useState<
    { id: string; name: string; accountIds: number[] }[]
  >([]);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");
  const [altText, setAltText] = useState("");

  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"accounts" | "compose" | "settings">("compose");

  const [activePlatformTab, setActivePlatformTab] =
    useState<PlatformName | null>(null);

  /* ---------------- SUBMIT STATE ---------------- */
  const [submitting, setSubmitting] = useState(false);
  const [resultsModal, setResultsModal] = useState<PostResult[] | null>(null);

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

    const upload = async () => {
      setUploadError(null);
      try {
        const uploaded = await Promise.all(
          Array.from(files).map((file) => {
            const fd = new FormData();
            fd.append("file", file);
            return uploadMedia(fd);
          })
        );

        // FIX: append to existing media instead of replacing
        setMedia((prev) => [...prev, ...uploaded]);
        setSelectedMediaIds((prev) => [...prev, ...uploaded.map((m) => m.id)]);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Upload failed. Please try again.";
        setUploadError(message);
        console.error("Media upload failed:", err);
      }
    };

    upload();
  };

  const toggleMedia = (id: number) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------------- PLATFORM ---------------- */

  const handlePlatformToggle = (platform: PlatformName, enabled?: boolean) => {
    setSelectedPlatforms((prev) => {
      const isSelected = prev.includes(platform);
      const shouldEnable = enabled !== undefined ? enabled : !isSelected;
      if (shouldEnable && !isSelected) {
        setActivePlatformTab(platform);
        return [...prev, platform];
      }
      if (!shouldEnable && isSelected) {
        return prev.filter((p) => p !== platform);
      }
      return prev;
    });
  };

  const handleSelectAll = (enabled: boolean) => {
    setSelectedPlatforms(enabled ? PLATFORM_ORDER : []);
    if (enabled && PLATFORM_ORDER.length > 0) {
      setActivePlatformTab(PLATFORM_ORDER[0]);
    }
  };

  const handleSelectAllAccounts = (
    platform: PlatformName,
    enabled: boolean
  ) => {
    const accs = accountsByPlatform[platform];

    setSelectedAccounts((prev) => ({
      ...prev,
      [platform]: enabled ? accs.map((a) => a.id) : [],
    }));
  };

  const handleAccountToggle = (
    platform: PlatformName,
    accountId: number,
    enabled: boolean
  ) => {
    setSelectedAccounts((prev) => {
      const current = prev[platform];

      return {
        ...prev,
        [platform]: enabled
          ? [...current, accountId]
          : current.filter((id) => id !== accountId),
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

  const handleSubmit = async () => {
    const selectedPlatformList = PLATFORM_ORDER.filter(
      (p) => selectedPlatforms.includes(p) && selectedAccounts[p].length > 0
    );

    if (selectedPlatformList.length === 0) return;

    // YouTube title guard
    if (
      selectedPlatformList.includes("youtube") &&
      !platformConfigs.youtube.youtubeTitle.trim()
    ) {
      alert("Please enter a video title for YouTube before publishing.");
      setActivePlatformTab("youtube");
      return;
    }

    const content = [
      caption.trim(),
      hashtags.trim()
        ? hashtags
            .split(",")
            .map((h) => h.trim())
            .filter(Boolean)
            .map((h) => (h.startsWith("#") ? h : `#${h}`))
            .join(" ")
        : "",
      mentions.trim()
        ? mentions
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean)
            .map((m) => (m.startsWith("@") ? m : `@${m}`))
            .join(" ")
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    setSubmitting(true);

    const jobs = selectedPlatformList.flatMap((platform) =>
      selectedAccounts[platform].map((accountId) => {
        const cfg = platformConfigs[platform];
        const account = accountsByPlatform[platform].find(
          (a) => a.id === accountId
        );
        return {
          platform,
          accountId,
          accountName: account?.account_name ?? `Account ${accountId}`,
          cfg,
        };
      })
    );

    const results: PostResult[] = await Promise.all(
      jobs.map(async ({ platform, accountId, accountName, cfg }) => {
        try {
          const scheduledAt = cfg.schedule
            ? new Date(cfg.schedule).toISOString()
            : null;
          const res = await createPost({
            social_account_id: accountId,
            content,
            scheduled_at: scheduledAt,
            media_ids: selectedMediaIds,
            platform_options: { [platform]: cfg },
          });
          return {
            platform,
            accountId,
            accountName,
            status: "success" as const,
            postId: res.post_id,
          };
        } catch (err) {
          return {
            platform,
            accountId,
            accountName,
            status: "error" as const,
            error: err instanceof Error ? err.message : "Unknown error",
          };
        }
      })
    );

    setSubmitting(false);
    setResultsModal(results);
  };

  /* ---------------- DERIVED ---------------- */

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_ORDER.reduce((acc, p) => {
      acc[p] = accounts.filter((a) => a.platform?.toLowerCase() === p);
      return acc;
    }, {} as Record<PlatformName, Account[]>);
  }, [accounts]);

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

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  return (
    <main className="flex h-full flex-col">

      {/* MOBILE TAB BAR — hidden on desktop */}
      <div className="flex border-b bg-white md:hidden">
        {(["accounts", "compose", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
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
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Accounts */}
        <div
          className={`w-full overflow-y-auto border-b bg-white md:block md:w-[260px] md:border-b-0 md:border-r ${
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
          />
        </div>

        {/* CENTER — Compose */}
        <div
          className={`flex w-full flex-1 flex-col overflow-y-auto bg-white ${
            mobileTab === "compose" ? "flex" : "hidden md:flex"
          }`}
        >
          <PostEditor
            caption={caption}
            hashtags={hashtags}
            mentions={mentions}
            altText={altText}
            media={media}
            selectedMediaIds={selectedMediaIds}
            selectedPlatforms={selectedPlatforms}
            uploadError={uploadError}
            onCaptionChange={setCaption}
            onHashtagsChange={setHashtags}
            onMentionsChange={setMentions}
            onAltTextChange={setAltText}
            onMediaSelectionToggle={toggleMedia}
            onFilesSelected={handleFilesSelected}
          />
        </div>

        {/* RIGHT — Settings */}
        <div
          className={`w-full overflow-y-auto bg-white md:block md:w-[300px] md:border-l ${
            mobileTab === "settings" ? "block" : "hidden md:block"
          }`}
        >
          <PlatformSettings
            selectedPlatforms={selectedPlatforms}
            platformConfigs={platformConfigs}
            activePlatformTab={activePlatformTab}
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

      {/* POST BUTTON BAR */}
      <div className="flex items-center justify-between border-t border-[#eadfcb] bg-[#fffef9] px-5 py-3 shadow-[0_-4px_18px_rgba(180,144,34,0.08)]">
        <div className="text-xs text-[#9b7b3f]">
          {totalSelectedAccounts > 0
            ? `Publishing to ${totalSelectedAccounts} account${
                totalSelectedAccounts !== 1 ? "s" : ""
              } across ${selectedPlatforms.length} platform${
                selectedPlatforms.length !== 1 ? "s" : ""
              }`
            : "Select accounts to publish"}
        </div>
        <motion.button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting || totalSelectedAccounts === 0 || !caption.trim()}
          whileHover={{ scale: submitting ? 1 : 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex items-center gap-2.5 rounded-full bg-[#ffd52a] px-7 py-2.5 text-sm font-bold text-[#09090e] shadow-[0_6px_22px_rgba(255,213,42,0.35)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#09090e] border-t-transparent" />
              Publishing…
            </>
          ) : (
            <>
              <svg
                width="15"
                height="15"
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
              Publish Now
            </>
          )}
        </motion.button>
      </div>

      {/* RESULTS MODAL */}
      <AnimatePresence>
        {resultsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#1e2535] bg-[#0d1018] shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            >
              {(() => {
                const successCount = resultsModal.filter(
                  (r) => r.status === "success"
                ).length;
                const errorCount = resultsModal.filter(
                  (r) => r.status === "error"
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
                                ? "bg-[#22d48a]/20 text-[#22d48a]"
                                : "bg-[#ff6b5b]/20 text-[#ff6b5b]"
                            }`}
                          >
                            {allOk ? "✓" : "!"}
                          </div>
                          <div>
                            <h2 className="text-base font-bold text-white">
                              {allOk
                                ? "Posts published!"
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
                    <div className="max-h-[380px] space-y-2.5 overflow-y-auto px-4 py-4">
                      {resultsModal.map((result, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 rounded-[16px] border p-3.5 ${
                            result.status === "success"
                              ? "border-[#1a3a20] bg-[#0d1f12]"
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
                                    ? "bg-[#22d48a]/15 text-[#22d48a]"
                                    : "bg-[#ff6b5b]/15 text-[#ff6b5b]"
                                }`}
                              >
                                {result.status === "success"
                                  ? "Published"
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
                                  <span className="text-[11px] text-[#5a7a6a]">
                                    Post #{result.postId}
                                  </span>
                                )}
                                {result.postUrl && (
                                  <a
                                    href={result.postUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4de8a3] transition-colors hover:text-[#7ef5c0]"
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
                    <div className="flex items-center justify-between gap-3 border-t border-[#1a2030] px-5 py-4">
                      <a
                        href="/posts"
                        className="text-xs font-medium text-[#6a8aaa] transition-colors hover:text-[#93b8d8]"
                      >
                        View all scheduled posts →
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          // FIX: snapshot results before clearing to avoid stale closure
                          const results = resultsModal;
                          setResultsModal(null);
                          if (results.some((r) => r.status === "success")) {
                            setCaption("");
                            setHashtags("");
                            setMentions("");
                            setSelectedMediaIds([]);
                            setSelectedPlatforms([]);
                            setSelectedAccounts(createEmptySelectedAccounts());
                          }
                        }}
                        className="rounded-full bg-[#ffd52a] px-5 py-2 text-sm font-bold text-[#09090e] shadow-[0_4px_14px_rgba(255,213,42,0.3)] transition-colors hover:bg-[#ffe566]"
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