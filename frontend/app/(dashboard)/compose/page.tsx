"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { PlatformLogo } from "@/components/platform-logo";
import { fetchAccounts } from "@/lib/api";
import { Account, PlatformName } from "@/lib/types";

type UploadPreview = {
  id: string;
  file: File;
  previewUrl: string;
};

const PLATFORM_TABS: PlatformName[] = ["facebook", "instagram", "linkedin"];

const PLATFORM_LABELS: Record<PlatformName, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "X",
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
  return accountType.replace(/_/g, " ");
}

function AccountAvatar({ account }: { account: Account }) {
  if (account.profile_picture_url) {
    return (
      <img
        src={account.profile_picture_url}
        alt={account.account_name}
        className="h-10 w-10 rounded-full border border-gray-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-sm font-semibold text-ink-700">
      {account.account_name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ComposeDashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
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

  useEffect(() => {
    return () => {
      uploads.forEach((upload) => URL.revokeObjectURL(upload.previewUrl));
    };
  }, [uploads]);

  const groupedAccounts = useMemo(() => {
    return PLATFORM_TABS.map((platform) => ({
      platform,
      accounts: accounts.filter((account) => normalizePlatform(account.platform) === platform),
    })).filter((group) => group.accounts.length > 0);
  }, [accounts]);

  const selectedAccounts = useMemo(
    () => accounts.filter((account) => selectedAccountIds.includes(account.id)),
    [accounts, selectedAccountIds],
  );

  const activePlatformAccounts = useMemo(
    () => accounts.filter((account) => normalizePlatform(account.platform) === activePlatform),
    [accounts, activePlatform],
  );

  function toggleAccount(accountId: number, checked: boolean) {
    setSelectedAccountIds((current) =>
      checked ? [...new Set([...current, accountId])] : current.filter((id) => id !== accountId),
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-600">Compose</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.05em] text-ink-900">
            Create a new post
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-600">
            Select accounts, draft the main post once, and tune the platform-specific details from the right panel.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="status-pill status-pill-muted">
            {selectedAccountIds.length} account{selectedAccountIds.length === 1 ? "" : "s"} selected
          </span>
          <span className="status-pill status-pill-muted">
            {uploads.length} media item{uploads.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      {error ? (
        <div className="card px-4 py-3 text-sm text-[#b64e48]">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <section className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Accounts</h2>
              <p className="mt-1 text-sm text-ink-600">Choose where this post should be published.</p>
            </div>
            {loading ? <span className="text-xs text-ink-500">Loading...</span> : null}
          </div>

          <div className="mt-5 space-y-5">
            {groupedAccounts.map((group) => (
              <div key={group.platform} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-ink-800">
                    <PlatformLogo platform={group.platform} className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink-900">{PLATFORM_LABELS[group.platform]}</div>
                    <div className="text-xs text-ink-500">
                      {group.accounts.length} connected account{group.accounts.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.accounts.map((account) => {
                    const checked = selectedAccountIds.includes(account.id);

                    return (
                      <label
                        key={account.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                          checked ? "border-brand-300 bg-brand-50" : "border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => toggleAccount(account.id, event.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-400 focus:ring-brand-300"
                        />
                        <AccountAvatar account={account} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink-900">{account.account_name}</div>
                          <div className="truncate text-xs text-ink-500">{formatAccountType(account.account_type)}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            {!loading && !groupedAccounts.length ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-ink-600">
                No connected accounts found yet.
              </div>
            ) : null}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Post editor</h2>
              <p className="mt-1 text-sm text-ink-600">Write once, then add media, hashtags, and mentions.</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-ink-600">
              {caption.length} chars
            </span>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-800">Caption</label>
              <textarea
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Write your post content here..."
                className="field-input min-h-[220px] resize-none"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-ink-800">Media upload</label>
                <span className="text-xs text-ink-500">Images and videos supported</span>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center transition-colors hover:border-brand-300 hover:bg-brand-50">
                <span className="text-sm font-medium text-ink-900">Click to upload media</span>
                <span className="mt-1 text-xs text-ink-500">Attach files to preview them before posting.</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleUploadChange}
                  className="hidden"
                />
              </label>

              {uploads.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {uploads.map((upload) => {
                    const isImage = upload.file.type.startsWith("image/");

                    return (
                      <div key={upload.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                        <div className="aspect-[4/3] bg-gray-100">
                          {isImage ? (
                            <img src={upload.previewUrl} alt={upload.file.name} className="h-full w-full object-cover" />
                          ) : (
                            <video src={upload.previewUrl} className="h-full w-full object-cover" controls />
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-ink-900">{upload.file.name}</div>
                            <div className="text-xs text-ink-500">
                              {Math.max(1, Math.round(upload.file.size / 1024))} KB
                            </div>
                          </div>
                          <button type="button" onClick={() => removeUpload(upload.id)} className="ghost-button px-3 py-2 text-xs">
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-800">Hashtags</label>
                <input
                  value={hashtags}
                  onChange={(event) => setHashtags(event.target.value)}
                  placeholder="#launch, #crm"
                  className="field-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-800">Mentions</label>
                <input
                  value={mentions}
                  onChange={(event) => setMentions(event.target.value)}
                  placeholder="@partner, @brand"
                  className="field-input"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <div>
            <h2 className="text-base font-semibold text-ink-900">Platform settings</h2>
            <p className="mt-1 text-sm text-ink-600">Switch tabs to review platform-specific details.</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {PLATFORM_TABS.map((platform) => {
              const active = platform === activePlatform;
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setActivePlatform(platform)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    active ? "border-brand-300 bg-brand-50 text-ink-900" : "border-gray-200 bg-white text-ink-600 hover:bg-gray-50"
                  }`}
                >
                  <PlatformLogo platform={platform} className="h-4 w-4" />
                  {PLATFORM_LABELS[platform]}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-sm font-medium text-ink-900">{PLATFORM_LABELS[activePlatform]} destinations</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activePlatformAccounts
                  .filter((account) => selectedAccountIds.includes(account.id))
                  .map((account) => (
                    <span key={account.id} className="status-pill status-pill-muted">
                      {account.account_name}
                    </span>
                  ))}
                {!activePlatformAccounts.some((account) => selectedAccountIds.includes(account.id)) ? (
                  <span className="text-xs text-ink-500">No {PLATFORM_LABELS[activePlatform]} account selected yet.</span>
                ) : null}
              </div>
            </div>

            {activePlatform === "facebook" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-800">Post type</label>
                  <select className="field-input" defaultValue="photo">
                    <option value="photo">Photo post</option>
                    <option value="video">Video post</option>
                    <option value="link">Link post</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-800">Privacy</label>
                  <select className="field-input" defaultValue="public">
                    <option value="public">Public</option>
                    <option value="friends">Friends</option>
                    <option value="private">Only me</option>
                  </select>
                </div>
              </>
            ) : null}

            {activePlatform === "instagram" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-800">Format</label>
                  <select className="field-input" defaultValue="feed">
                    <option value="feed">Feed post</option>
                    <option value="reel">Reel</option>
                    <option value="story">Story</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-800">First comment</label>
                  <textarea
                    className="field-input min-h-[110px] resize-none"
                    placeholder="Optional first comment for extra hashtags..."
                  />
                </div>
              </>
            ) : null}

            {activePlatform === "linkedin" ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-800">Audience</label>
                  <select className="field-input" defaultValue="public">
                    <option value="public">Public</option>
                    <option value="connections">Connections only</option>
                    <option value="logged_in">Logged in members</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-ink-800">Callout</label>
                  <input className="field-input" placeholder="Optional professional headline or CTA" />
                </div>
              </>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button type="button" className="secondary-button">
          Save draft
        </button>
        <button type="button" className="primary-button">
          Review post
        </button>
      </div>

      {selectedAccounts.length ? (
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink-900">Selected accounts</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedAccounts.map((account) => (
              <span key={account.id} className="status-pill status-pill-muted">
                {account.account_name}
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
