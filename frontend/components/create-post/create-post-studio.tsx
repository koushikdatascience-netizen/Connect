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

  /* ✅ GROUP STATE */
  const [groupName, setGroupName] = useState("");
  const [accountGroups, setAccountGroups] = useState<
    { id: string; name: string; accountIds: number[] }[]
  >([]);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");
  const [altText, setAltText] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [activePlatformTab, setActivePlatformTab] =
    useState<PlatformName | null>(null);
  

  /* ---------------- LOAD ---------------- */
const [mobileTab, setMobileTab] = useState<"accounts" | "compose" | "settings">("compose");
  // AFTER
useEffect(() => {
  async function load() {
    setLoading(true);
    try {
      const data = await fetchAccounts();
      setAccounts(data.filter((a) => a.is_active));
    } catch (err) {
      console.error("Failed to load accounts:", err);
      // Still stop loading so the UI renders, just with no accounts
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
      const uploaded = await Promise.all(
        Array.from(files).map((file) => {
          const fd = new FormData();
          fd.append("file", file);
          return uploadMedia(fd);
        })
      );

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

  /* ---------------- DERIVED ---------------- */

  const accountsByPlatform = useMemo(() => {
    return PLATFORM_ORDER.reduce((acc, p) => {
      acc[p] = accounts.filter(
        (a) => a.platform?.toLowerCase() === p
      );
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
    return <div className="flex h-full items-center justify-center">Loading...</div>;
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
          {tab === "accounts" ? "Accounts" : tab === "compose" ? "Compose" : "Settings"}
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
      <div className={`w-full overflow-y-auto border-b bg-white md:block md:w-[260px] md:border-b-0 md:border-r ${mobileTab === "accounts" ? "block" : "hidden md:block"}`}>
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
      <div className={`flex w-full flex-1 flex-col overflow-y-auto bg-white ${mobileTab === "compose" ? "flex" : "hidden md:flex"}`}>
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

      {/* RIGHT — Settings */}
      <div className={`w-full overflow-y-auto bg-white md:block md:w-[300px] md:border-l ${mobileTab === "settings" ? "block" : "hidden md:block"}`}>
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
  </main>
);
}