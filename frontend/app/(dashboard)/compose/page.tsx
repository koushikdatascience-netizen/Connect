"use client";

import { ChangeEvent, ReactNode, useEffect, useMemo, useState } from "react";

import { PlatformLogo } from "@/components/platform-logo";
import { fetchAccounts } from "@/lib/api";
import { Account, PlatformName } from "@/lib/types";

type UploadPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

const PLATFORM_TABS: PlatformName[] = ["facebook", "instagram", "linkedin"];
const PLATFORM_ORDER: PlatformName[] = ["facebook", "instagram", "linkedin", "twitter", "youtube"];

const PLATFORM_LABELS: Record<PlatformName, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X (Twitter)",
  youtube: "YouTube",
  blogger: "Blogger",
  google_business: "Google Business",
  wordpress: "WordPress",
};

function normalizePlatform(value: string | null | undefined): PlatformName | null {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized in PLATFORM_LABELS ? (normalized as PlatformName) : null;
}

function formatAccountType(accountType?: string | null) {
  if (!accountType) return "Connected account";
  return accountType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function accountInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function AccountAvatar({ account }: { account: Account }) {
  if (account.profile_picture_url) {
    return (
      <img
        src={account.profile_picture_url}
        alt={account.account_name}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#121727] text-xs font-semibold text-white">
      {accountInitials(account.account_name)}
    </div>
  );
}

function MiniField({
  label,
  children,
  helper,
}: {
  label: string;
  children: ReactNode;
  helper?: string;
}) {
  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-sm font-semibold text-ink-900">{label}</label>
        {helper ? <p className="mt-0.5 text-xs text-ink-500">{helper}</p> : null}
      </div>
      {children}
    </div>
  );
}

export default function ComposeDashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [openPlatforms, setOpenPlatforms] = useState<PlatformName[]>(["facebook"]);
  const [activePlatform, setActivePlatform] = useState<PlatformName>("facebook");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [mentions, setMentions] = useState("");
  const [uploads, setUploads] = useState<UploadPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true);
        const response = await fetchAccounts();
        const activeAccounts = response.filter((account) => account.is_active);
        setAccounts(activeAccounts);
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load accounts.");
      } finally {
        setLoading(false);
      }
    }

    void loadAccounts();
  }, []);

  useEffect(() => () => uploads.forEach((upload) => URL.revokeObjectURL(upload.previewUrl)), [uploads]);

  const groupedAccounts = useMemo(() => {
    return PLATFORM_ORDER.map((platform) => ({
      platform,
      accounts: accounts.filter((account) => normalizePlatform(account.platform) === platform),
    })).filter((group) => group.accounts.length > 0);
  }, [accounts]);

  const activePlatformAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          normalizePlatform(account.platform) === activePlatform && selectedAccountIds.includes(account.id),
      ),
    [accounts, activePlatform, selectedAccountIds],
  );

  const selectedPlatforms = useMemo(
    () =>
      PLATFORM_TABS.filter((platform) =>
        accounts.some(
          (account) =>
            selectedAccountIds.includes(account.id) && normalizePlatform(account.platform) === platform,
        ),
      ),
    [accounts, selectedAccountIds],
  );

  function toggleAccount(accountId: number, checked: boolean) {
    setSelectedAccountIds((current) =>
      checked ? [...new Set([...current, accountId])] : current.filter((id) => id !== accountId),
    );
  }

  function togglePlatformOpen(platform: PlatformName) {
    setOpenPlatforms((current) =>
      current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform],
    );
  }

  function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    const nextUploads = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setUploads((current) => [...current, ...nextUploads]);
    event.target.value = "";
  }

  function removeUpload(uploadId: string) {
    setUploads((current) => {
      const target = current.find((upload) => upload.id === uploadId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((upload) => upload.id !== uploadId);
    });
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6b12]">Compose</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em] text-ink-900">Create your post</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">A cleaner publishing workspace with accounts on the left, content in the center, and one platform settings panel at a time.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="status-pill status-pill-muted">{selectedAccountIds.length} selected</span>
          <span className="status-pill status-pill-muted">{uploads.length} media</span>
        </div>
      </header>

      {error ? (
        <div className="card px-4 py-3 text-sm text-[#b64e48]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <section className="card overflow-hidden p-0">
          <div className="border-b border-[#ece7d8] px-5 py-5">
            <h2 className="text-xl font-semibold text-ink-900">Platforms & Accounts</h2>
            <p className="mt-1 text-sm text-ink-600">Select accounts to publish your post.</p>
          </div>

          <div className="px-4 py-4">
            {loading ? <div className="rounded-2xl bg-[#f8f5eb] px-4 py-8 text-center text-sm text-ink-600">Loading connected accounts...</div> : null}

            <div className="space-y-4">
              {groupedAccounts.map((group, index) => {
                const expanded = openPlatforms.includes(group.platform);

                return (
                  <div key={group.platform} className="relative pl-7">
                    <div className="absolute left-3 top-0 h-full w-px bg-[#ece7d8]" />
                    <div className={`absolute left-0 top-2.5 h-6 w-6 rounded-full border-2 ${expanded ? "border-[#5e4eff] bg-[#5e4eff]" : "border-[#d7d1c1] bg-white"}`} />

                    <button type="button" onClick={() => togglePlatformOpen(group.platform)} className="relative z-10 flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
                        <PlatformLogo platform={group.platform} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-base font-semibold text-ink-900">{PLATFORM_LABELS[group.platform]}</div>
                        <div className="text-sm text-ink-500">{group.accounts.length} account{group.accounts.length === 1 ? "" : "s"}</div>
                      </div>
                      <svg viewBox="0 0 20 20" className={`h-4 w-4 text-ink-500 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {expanded ? (
                      <div className="mt-3 rounded-[22px] border border-[#ece7d8] bg-[#fffdfa] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                        <div className="space-y-2">
                          {group.accounts.map((account) => {
                            const checked = selectedAccountIds.includes(account.id);

                            return (
                              <label key={account.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition-all ${checked ? "bg-[#f4f0ff]" : "hover:bg-[#f7f4eb]"}`}>
                                <input type="checkbox" checked={checked} onChange={(event) => toggleAccount(account.id, event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#5e4eff] focus:ring-[#b7adff]" />
                                <AccountAvatar account={account} />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-semibold text-ink-900">{account.account_name}</div>
                                  <div className="truncate text-xs text-ink-500">{formatAccountType(account.account_type)}</div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {index === groupedAccounts.length - 1 ? <div className="absolute left-3 bottom-0 top-2.5 w-px bg-white" /> : null}
                  </div>
                );
              })}

              {!loading && !groupedAccounts.length ? (
                <div className="rounded-2xl border border-dashed border-[#ded8c9] bg-[#fbfaf6] px-4 py-8 text-center text-sm text-ink-600">
                  No connected accounts found yet.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <div className="text-sm font-semibold text-ink-700">Selected platforms ({selectedPlatforms.length})</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {selectedPlatforms.length ? selectedPlatforms.map((platform) => (
                <button key={platform} type="button" onClick={() => setActivePlatform(platform)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${activePlatform === platform ? "border-[#cfc7ff] bg-[#f6f4ff] text-ink-900" : "border-[#ece7d8] bg-white text-ink-700"}`}>
                  <PlatformLogo platform={platform} className="h-4 w-4" />
                  {PLATFORM_LABELS[platform]}
                </button>
              )) : <span className="text-sm text-ink-500">Select at least one Facebook, Instagram, or LinkedIn account.</span>}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-col gap-4 border-b border-[#efe8d6] pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[32px] font-semibold tracking-[-0.05em] text-ink-900">Create your post</h2>
                <p className="mt-1 text-base text-ink-500">Write once, publish everywhere.</p>
              </div>
              <button type="button" className="secondary-button px-4 py-3 text-sm">Customize per platform</button>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-3 block text-sm font-semibold text-ink-900">Caption</label>
                <div className="rounded-[26px] border border-[#ece7d8] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
                  <textarea value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Write your post caption here..." className="min-h-[220px] w-full resize-none rounded-[26px] border-0 bg-transparent px-5 py-5 text-base text-ink-900 outline-none placeholder:text-ink-400" />
                  <div className="flex items-center justify-between border-t border-[#f1ebdb] px-5 py-4 text-[#7c7a92]">
                    <div className="flex items-center gap-4 text-lg"><span>:)</span><span>#</span><span>@</span></div>
                    <span className="text-sm">{caption.length} / 2200</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-semibold text-ink-900">Media</div>
                <div className="flex flex-wrap gap-4">
                  {uploads.map((upload) => {
                    const isImage = upload.file.type.startsWith("image/");
                    return (
                      <div key={upload.id} className="relative h-[160px] w-[150px] overflow-hidden rounded-[24px] border border-[#ece7d8] bg-[#f5f1e6]">
                        {isImage ? <img src={upload.previewUrl} alt={upload.file.name} className="h-full w-full object-cover" /> : <video src={upload.previewUrl} className="h-full w-full object-cover" controls />}
                        <button type="button" onClick={() => removeUpload(upload.id)} className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm text-ink-700 shadow-sm">x</button>
                      </div>
                    );
                  })}
                  <label className="flex h-[160px] w-[150px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d9d1c0] bg-[#fffdfa] text-center">
                    <span className="text-4xl leading-none text-[#6a5cff]">+</span>
                    <span className="mt-3 text-sm font-medium text-[#5e4eff]">Add photos or videos</span>
                    <span className="mt-1 text-xs text-ink-500">or drag and drop</span>
                    <input type="file" accept="image/*,video/*" multiple onChange={handleUploadChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <MiniField label="Hashtags" helper="Optional">
                  <div className="relative">
                    <input value={hashtags} onChange={(event) => setHashtags(event.target.value)} placeholder="Add hashtags..." className="field-input pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[#8a84b0]">#</span>
                  </div>
                </MiniField>
                <MiniField label="Mentions" helper="Optional">
                  <div className="relative">
                    <input value={mentions} onChange={(event) => setMentions(event.target.value)} placeholder="Add mentions..." className="field-input pr-12" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-[#8a84b0]">@</span>
                  </div>
                </MiniField>
              </div>

              <div className="rounded-2xl bg-[linear-gradient(90deg,rgba(108,92,255,0.08),rgba(255,255,255,0.7))] px-4 py-3 text-sm text-[#5e4eff]">
                These details will be applied to all selected platforms.
              </div>
            </div>
          </div>
        </section>

        <section className="card overflow-hidden p-0">
          <div className="border-b border-[#ece7d8] px-4 pt-4">
            <div className="flex gap-1 overflow-x-auto">
              {PLATFORM_TABS.map((platform) => (
                <button key={platform} type="button" onClick={() => setActivePlatform(platform)} className={`flex min-w-fit items-center gap-2 rounded-t-2xl border-b-2 px-4 py-3 text-sm font-semibold ${activePlatform === platform ? "border-[#5e4eff] text-ink-900" : "border-transparent text-ink-500"}`}>
                  <PlatformLogo platform={platform} className="h-4 w-4" />
                  {PLATFORM_LABELS[platform]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div>
              <h2 className="text-[30px] font-semibold tracking-[-0.05em] text-ink-900">{PLATFORM_LABELS[activePlatform]} post settings</h2>
              <p className="mt-1 text-sm text-ink-500">Customize how your post will appear on {PLATFORM_LABELS[activePlatform]}.</p>
            </div>

            <MiniField label={activePlatform === "instagram" ? "Format" : "Post type"}>
              <select className="field-input">
                {activePlatform === "facebook" ? <><option>Photo post</option><option>Video post</option><option>Link post</option></> : null}
                {activePlatform === "instagram" ? <><option>Feed post</option><option>Reel</option><option>Story</option></> : null}
                {activePlatform === "linkedin" ? <><option>Standard post</option><option>Document post</option><option>Image post</option></> : null}
              </select>
            </MiniField>

            <MiniField label={activePlatform === "linkedin" ? "Profile or page" : "Account"}>
              <select className="field-input">
                {activePlatformAccounts.length ? activePlatformAccounts.map((account) => <option key={account.id}>{account.account_name}</option>) : <option>No account selected</option>}
              </select>
            </MiniField>

            <MiniField label={activePlatform === "instagram" ? "Visibility" : activePlatform === "linkedin" ? "Audience" : "Privacy"}>
              <select className="field-input">
                <option>Public</option>
                <option>Connections only</option>
                <option>Everyone</option>
              </select>
            </MiniField>

            <MiniField label="AI assist" helper="Optional">
              <div className="flex items-center justify-between rounded-2xl border border-[#ece7d8] bg-[#fffdfa] px-4 py-4">
                <div>
                  <div className="text-sm font-semibold text-ink-900">Improve content</div>
                  <div className="mt-1 text-xs text-ink-500">Enhance your post for better engagement.</div>
                </div>
                <div className="flex h-7 w-12 items-center rounded-full bg-[#6a5cff] px-1">
                  <div className="ml-auto h-5 w-5 rounded-full bg-white" />
                </div>
              </div>
            </MiniField>

            <div className="space-y-3">
              <div className="text-sm font-semibold text-ink-900">{PLATFORM_LABELS[activePlatform]} options</div>
              <label className="flex items-center gap-3 text-sm text-ink-700"><input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-[#5e4eff]" /> Allow comments</label>
              <label className="flex items-center gap-3 text-sm text-ink-700"><input type="checkbox" defaultChecked={activePlatform !== "instagram"} className="h-4 w-4 rounded border-gray-300 text-[#5e4eff]" /> Allow shares</label>
              <label className="flex items-center gap-3 text-sm text-ink-700"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#5e4eff]" /> Add to story or highlight</label>
            </div>

            <button type="button" className="text-sm font-medium text-[#5e4eff]">Reset to default</button>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <button type="button" className="secondary-button">Schedule for later</button>
        <button type="button" className="primary-button">Review & publish</button>
      </div>
    </main>
  );
}
