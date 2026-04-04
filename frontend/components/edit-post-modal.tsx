"use client";

import { useEffect, useState } from "react";

import { updatePost } from "@/lib/api";
import { Post } from "@/lib/types";

function toLocalDateTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

type Props = {
  post: Post | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

export function EditPostModal({ post, onClose, onSaved }: Props) {
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!post) {
      return;
    }
    setContent(post.content ?? "");
    setScheduledAt(toLocalDateTime(post.scheduled_at));
    setError(null);
  }, [post]);

  if (!post) {
    return null;
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      await updatePost(post.id, {
        content,
        scheduled_at: scheduledAt || null,
      });
      await onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update post.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-shell small" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">Edit scheduled post</h2>
            <p className="section-copy" style={{ marginBottom: 0 }}>
              Update the post content or reschedule the execution time.
            </p>
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close editor">
            x
          </button>
        </div>
        <div className="modal-body">
          {error ? <div className="banner error">{error}</div> : null}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="editContent">Content</label>
              <textarea
                id="editContent"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="editSchedule">Schedule time</label>
              <input
                id="editSchedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
            </div>
            <div className="cta-row">
              <button className="btn primary" onClick={() => void handleSave()} type="button" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button className="btn ghost" onClick={onClose} type="button" disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
