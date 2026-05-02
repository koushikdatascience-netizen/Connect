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
    if (!files) return;

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

  /* ---------------- PLATFORM LOGIC (FIXED) ---------------- */

  const handlePlatformToggle = (platform: PlatformName) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSelectAll = (enabled: boolean) => {
    setSelectedPlatforms(enabled ? PLATFORM_ORDER : []);
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

  const totalSelectedAccounts = Object.values(selectedAccounts).flat().length;

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading workspace...
      </div>
    );
  }

  return (
    <main className="flex h-full flex-col">
      <div className="flex flex-1 gap-6 p-4">

        {/* LEFT SIDEBAR */}
        <div className="w-[260px] shrink-0 h-full overflow-y-auto pr-1 rounded-2xl border bg-white shadow-sm">
          <Sidebar
            platforms={sidebarPlatforms}
            totalSelectedAccounts={totalSelectedAccounts}
            totalAccounts={accounts.length}
            groupName=""
            accountGroups={[]}
            onGroupNameChange={() => {}}
            onSaveGroup={() => {}}
            onApplyGroup={() => {}}
            onRemoveGroup={() => {}}
            onSelectAll={handleSelectAll}
            onPlatformToggle={handlePlatformToggle}
            onSelectAllAccounts={handleSelectAllAccounts}
            onAccountToggle={handleAccountToggle}
          />
        </div>

        {/* CENTER */}
        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-2xl border bg-white px-6 py-4 shadow-sm">
            <h1 className="text-lg font-semibold">Create your post</h1>
          </div>

          <AnimatePresence>
            {selectedPlatforms.length > 0 && (
              <motion.div className="flex gap-2 overflow-x-auto rounded-xl border bg-white px-3 py-2">
                {selectedPlatforms.map((p) => (
                  <div key={p} className="flex items-center gap-2 px-3 py-1 border rounded-full text-xs">
                    <PlatformLogo platform={p} className="h-3.5 w-3.5" />
                    {p}
                    <button onClick={() =>
                      setSelectedPlatforms((prev) =>
                        prev.filter((x) => x !== p)
                      )
                    }>✕</button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 overflow-y-auto rounded-2xl border bg-white shadow-sm">
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

        {/* RIGHT */}
        <div className="w-[300px] shrink-0 rounded-2xl border bg-white px-4 py-4 shadow-sm">
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
      <div className="border-t bg-white px-6 py-3">
        <div className="flex justify-end gap-3">
          <button onClick={() => router.push("/")}>Cancel</button>
          <button disabled={submitting}>
            {submitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>
    </main>
  );
}