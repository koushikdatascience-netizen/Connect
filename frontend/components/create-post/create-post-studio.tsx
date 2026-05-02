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
import { fetchAccounts, uploadMedia } from "@/lib/api";
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

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");
  const [altText, setAltText] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activePlatformTab, setActivePlatformTab] =
    useState<PlatformName | null>(null);

  /* ---------------- LOAD ---------------- */

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const accountData = await fetchAccounts();
        setAccounts(accountData.filter((a) => a.is_active));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------------- MEDIA ---------------- */

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const upload = async () => {
      const uploads = Array.from(files).map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        return uploadMedia(formData);
      });

      const uploaded = await Promise.all(uploads);

      setMedia(uploaded);
      setSelectedMediaIds(uploaded.map((m) => m.id));
    };

    upload();
  };

  const toggleMedia = (id: number) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------------- PLATFORM ---------------- */

  const handlePlatformToggle = (platform: PlatformName) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

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

  /* ---------------- LOADING ---------------- */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading workspace...
      </div>
    );
  }

  return (
    <main className="flex h-full flex-col">

      {/* MAIN GRID */}
      <div className="flex flex-1 gap-6 p-4">

        {/* LEFT SIDEBAR */}
        <div className="w-[260px] shrink-0 overflow-y-auto rounded-2xl border border-[#eadfcb] bg-white/80 backdrop-blur shadow-sm">
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
            onPlatformToggle={handlePlatformToggle}
            onSelectAllAccounts={() => {}}
            onAccountToggle={() => {}}
          />
        </div>

        {/* CENTER */}
        <div className="flex flex-1 flex-col gap-4">

          {/* HEADER */}
          <div className="rounded-2xl border border-[#eadfcb] bg-white/80 px-6 py-4 backdrop-blur shadow-sm">
            <h1 className="text-lg font-semibold text-[#2a2116]">
              Create your post
            </h1>

            <p className="text-xs text-[#8a7d6a]">
              Write once, publish everywhere
            </p>
          </div>

          {/* SELECTED PLATFORMS */}
          <AnimatePresence>
            {selectedPlatforms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-2 overflow-x-auto rounded-xl border border-[#eadfcb] bg-white/70 px-3 py-2 backdrop-blur"
              >
                {selectedPlatforms.map((p) => (
                  <motion.div
                    key={p}
                    whileHover={{ scale: 1.05 }}
                    className="flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs shadow-sm"
                  >
                    <PlatformLogo platform={p} className="h-3.5 w-3.5" />
                    <span className="capitalize">{p}</span>
                    <button
                      onClick={() =>
                        setSelectedPlatforms((prev) =>
                          prev.filter((x) => x !== p)
                        )
                      }
                      className="text-gray-400 hover:text-black"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* EDITOR */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-[#eadfcb] bg-white/80 backdrop-blur shadow-sm">
            <PostEditor
              caption={caption}
              hashtags={hashtags}
              mentions={mentions}
              altText={altText}
              media={media}
              selectedMediaIds={selectedMediaIds}
              selectedPlatforms={selectedPlatforms}
              onCaptionChange={setCaption}
              onHashtagsChange={setHashtags}
              onMentionsChange={setMentions}
              onAltTextChange={setAltText}
              onMediaSelectionToggle={toggleMedia}
              onFilesSelected={handleFilesSelected}
            />
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[300px] shrink-0 rounded-2xl border border-[#eadfcb] bg-white/80 px-4 py-4 backdrop-blur shadow-sm">
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

      {/* FOOTER */}
      <div className="border-t bg-white/80 px-6 py-3 backdrop-blur">
        <div className="flex justify-end gap-3">

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Cancel
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            disabled={submitting}
            className="rounded-lg bg-[#1f170c] px-6 py-2 text-sm text-[#f6d48f] shadow-md hover:bg-black"
          >
            {submitting ? "Publishing..." : "Publish"}
          </motion.button>
        </div>
      </div>
    </main>
  );
}