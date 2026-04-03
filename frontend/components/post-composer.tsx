"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { createPost, fetchAccounts, fetchMedia, uploadMedia } from "@/lib/api";
import { Account, MediaAsset } from "@/lib/types";

type PlatformFormState = {
  facebookPostAsReel: boolean;
  instagramCaptionMode: string;
  instagramFirstComment: string;
  linkedinVisibility: string;
  twitterReplySettings: string;
  youtubeTitle: string;
  youtubePrivacyStatus: string;
  youtubeTags: string;
};

export function PostComposer() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>([]);
  const [altText, setAltText] = useState("");
  const [platformForm, setPlatformForm] = useState<PlatformFormState>({
    facebookPostAsReel: false,
    instagramCaptionMode: "feed",
    instagramFirstComment: "",
    linkedinVisibility: "PUBLIC",
    twitterReplySettings: "everyone",
    youtubeTitle: "",
    youtubePrivacyStatus: "private",
    youtubeTags: "",
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [accountData, mediaData] = await Promise.all([fetchAccounts(), fetchMedia()]);
        const activeAccounts = accountData.filter((account) => account.is_active);
        setAccounts(activeAccounts);
        setMedia(mediaData);
        if (activeAccounts.length) {
          setSelectedAccountId(activeAccounts[0].id);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load form data.");
      }
    }

    void load();
  }, []);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId],
  );

  const platformOptionsPreview = useMemo(() => {
    if (!selectedAccount) {
      return {};
    }

    switch (selectedAccount.platform) {
      case "facebook":
        return {
          facebook: {
            post_as_reel: platformForm.facebookPostAsReel,
          },
        };
      case "instagram":
        return {
          instagram: {
            caption_mode: platformForm.instagramCaptionMode,
            first_comment: platformForm.instagramFirstComment || null,
          },
        };
      case "linkedin":
        return {
          linkedin: {
            visibility: platformForm.linkedinVisibility,
          },
        };
      case "twitter":
        return {
          twitter: {
            reply_settings: platformForm.twitterReplySettings,
          },
        };
      case "youtube":
        return {
          youtube: {
            title: platformForm.youtubeTitle,
            privacyStatus: platformForm.youtubePrivacyStatus,
            tags: platformForm.youtubeTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          },
        };
      default:
        return {};
    }
  }, [platformForm, selectedAccount]);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fileInput = event.currentTarget.elements.namedItem("mediaFile") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      setError("Choose a file before uploading.");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      formData.append("file", file);
      if (altText.trim()) {
        formData.append("alt_text", altText.trim());
      }

      const uploaded = await uploadMedia(formData);
      setMedia((current) => [uploaded, ...current]);
      setSelectedMediaIds((current) => [uploaded.id, ...current]);
      setAltText("");
      event.currentTarget.reset();
      setMessage("Media uploaded and ready for the next post.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Media upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAccountId) {
      setError("Select a connected account before creating a post.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setMessage(null);

      const result = await createPost({
        social_account_id: selectedAccountId,
        content,
        scheduled_at: scheduledAt || null,
        media_ids: selectedMediaIds,
        platform_options: platformOptionsPreview,
      });

      setMessage(`Post #${result.post_id} created with status "${result.status}".`);
      setContent("");
      setScheduledAt("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Post creation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid two">
      <section className="card section">
        <h2 className="section-title">Universal Composer</h2>
        <p className="section-copy">
          Pick one connected account, write your main content, attach uploaded media,
          and send platform-specific metadata as JSON.
        </p>

        {message ? <div className="banner success">{message}</div> : null}
        {error ? <div className="banner error">{error}</div> : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="account">Connected account</label>
            <select
              id="account"
              value={selectedAccountId ?? ""}
              onChange={(event) => setSelectedAccountId(Number(event.target.value))}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name} ({account.platform})
                </option>
              ))}
            </select>
            <div className="inline-note">
              Current platform: {selectedAccount ? selectedAccount.platform : "No account selected"}
            </div>
          </div>

          <div className="field">
            <label htmlFor="content">Universal content</label>
            <textarea
              id="content"
              placeholder="Write the shared message, caption, or publishing notes."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="scheduledAt">Schedule time</label>
            <input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </div>

          <div className="field">
            <label>Platform-specific settings</label>
            {selectedAccount?.platform === "facebook" ? (
              <label className="checkbox-card">
                <input
                  type="checkbox"
                  checked={platformForm.facebookPostAsReel}
                  onChange={(event) =>
                    setPlatformForm((current) => ({
                      ...current,
                      facebookPostAsReel: event.target.checked,
                    }))
                  }
                />
                <div>
                  <strong>Publish as reel</strong>
                  <div className="meta">Use Facebook reel-style publishing for this post.</div>
                </div>
              </label>
            ) : null}

            {selectedAccount?.platform === "instagram" ? (
              <>
                <select
                  value={platformForm.instagramCaptionMode}
                  onChange={(event) =>
                    setPlatformForm((current) => ({
                      ...current,
                      instagramCaptionMode: event.target.value,
                    }))
                  }
                >
                  <option value="feed">Feed post</option>
                  <option value="reel">Reel</option>
                </select>
                <input
                  type="text"
                  placeholder="First comment (optional)"
                  value={platformForm.instagramFirstComment}
                  onChange={(event) =>
                    setPlatformForm((current) => ({
                      ...current,
                      instagramFirstComment: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            {selectedAccount?.platform === "linkedin" ? (
              <select
                value={platformForm.linkedinVisibility}
                onChange={(event) =>
                  setPlatformForm((current) => ({
                    ...current,
                    linkedinVisibility: event.target.value,
                  }))
                }
              >
                <option value="PUBLIC">Public</option>
                <option value="CONNECTIONS">Connections</option>
              </select>
            ) : null}

            {selectedAccount?.platform === "twitter" ? (
              <select
                value={platformForm.twitterReplySettings}
                onChange={(event) =>
                  setPlatformForm((current) => ({
                    ...current,
                    twitterReplySettings: event.target.value,
                  }))
                }
              >
                <option value="everyone">Everyone</option>
                <option value="mentionedUsers">Mentioned users</option>
                <option value="following">People you follow</option>
              </select>
            ) : null}

            {selectedAccount?.platform === "youtube" ? (
              <>
                <input
                  type="text"
                  placeholder="Video title"
                  value={platformForm.youtubeTitle}
                  onChange={(event) =>
                    setPlatformForm((current) => ({
                      ...current,
                      youtubeTitle: event.target.value,
                    }))
                  }
                />
                <select
                  value={platformForm.youtubePrivacyStatus}
                  onChange={(event) =>
                    setPlatformForm((current) => ({
                      ...current,
                      youtubePrivacyStatus: event.target.value,
                    }))
                  }
                >
                  <option value="private">Private</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags, comma separated"
                  value={platformForm.youtubeTags}
                  onChange={(event) =>
                    setPlatformForm((current) => ({
                      ...current,
                      youtubeTags: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            <div className="inline-note">
              These fields are converted to JSON automatically before submission.
            </div>
          </div>

          <div className="field">
            <label>Attach existing media</label>
            <div className="checkbox-grid">
              {media.map((asset) => {
                const checked = selectedMediaIds.includes(asset.id);
                return (
                  <label key={asset.id} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedMediaIds((current) => [...current, asset.id]);
                        } else {
                          setSelectedMediaIds((current) => current.filter((item) => item !== asset.id));
                        }
                      }}
                    />
                    <div>
                      <strong>
                        #{asset.id} {asset.file_type}
                      </strong>
                      <div className="meta">{asset.alt_text || asset.file_url}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <button className="btn primary" disabled={submitting} type="submit">
            {submitting ? "Creating..." : "Create Post"}
          </button>
        </form>
      </section>

      <section className="card section">
        <h2 className="section-title">Media Upload</h2>
        <p className="section-copy">
          Upload media to the backend first. New assets appear immediately in the selection list.
        </p>

        <form className="form-grid" onSubmit={handleUpload}>
          <div className="field">
            <label htmlFor="mediaFile">Media file</label>
            <input id="mediaFile" name="mediaFile" type="file" />
          </div>

          <div className="field">
            <label htmlFor="altText">Alt text</label>
            <input
              id="altText"
              type="text"
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image or video for accessibility."
            />
          </div>

          <button className="btn secondary" disabled={uploading} type="submit">
            {uploading ? "Uploading..." : "Upload Media"}
          </button>
        </form>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginTop: 0 }}>JSON preview sent to backend</h3>
          <pre
            style={{
              margin: 0,
              whiteSpace: "pre-wrap",
              background: "rgba(255,255,255,0.82)",
              borderRadius: 16,
              border: "1px solid var(--line)",
              padding: 14,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(platformOptionsPreview, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
