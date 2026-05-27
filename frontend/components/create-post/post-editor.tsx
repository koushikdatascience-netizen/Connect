"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PLATFORM_LABELS } from "@/components/create-post/constants";
import { PlatformLogo } from "@/components/platform-logo";
import { MediaAsset, PlatformName } from "@/lib/types";

type Props = {
  caption: string;
  hashtags: string;
  mentions: string;
  media: MediaAsset[];
  selectedMediaIds: number[];
  editedMediaIds: number[];
  selectedPlatforms: PlatformName[];
  uploadError: string | null;
  editingMediaId: number | null;
  highlightedFixTargetId?: string | null;

  onCaptionChange: (v: string) => void;
  onHashtagsChange: (v: string) => void;
  onMentionsChange: (v: string) => void;

  onMediaSelectionToggle: (id: number) => void;
  onFilesSelected: (files: FileList | null) => void;
  onEditMedia: (asset: MediaAsset) => void;
};

function parseTokenValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeTokenValue(value: string, prefix: "#" | "@") {
  const trimmed = value.trim().replace(/^[#@]+/, "");
  if (!trimmed) {
    return "";
  }
  return `${prefix}${trimmed.replace(/\s+/g, "")}`;
}

type TokenInputProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  prefix: "#" | "@";
  onChange: (value: string) => void;
};

function TokenInput({
  id,
  label,
  placeholder,
  value,
  prefix,
  onChange,
}: TokenInputProps) {
  const [draft, setDraft] = useState("");
  const tokens = parseTokenValue(value);

  useEffect(() => {
    if (!value.trim()) {
      setDraft("");
    }
  }, [value]);

  const commitDraft = () => {
    const normalized = normalizeTokenValue(draft, prefix);
    if (!normalized) {
      setDraft("");
      return;
    }

    if (!tokens.includes(normalized)) {
      onChange([...tokens, normalized].join(", "));
    }
    setDraft("");
  };

  const removeToken = (tokenToRemove: string) => {
    onChange(tokens.filter((token) => token !== tokenToRemove).join(", "));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      if (draft.trim()) {
        event.preventDefault();
        commitDraft();
      }
      return;
    }

    if (event.key === "Backspace" && !draft && tokens.length > 0) {
      event.preventDefault();
      const nextTokens = [...tokens];
      const lastToken = nextTokens.pop();
      onChange(nextTokens.join(", "));
      setDraft(lastToken ? lastToken.replace(/^[#@]/, "") : "");
    }
  };

  return (
    <label
      htmlFor={id}
      className="
        rounded-2xl border border-[#eee3d0] bg-white/75 px-3 py-3
        transition-all duration-200 focus-within:border-[#d4a94f]
        focus-within:ring-2 focus-within:ring-[#d4a94f]/30
      "
    >
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
        {label}
      </div>
      <div className="flex min-h-[42px] flex-wrap items-center gap-2">
        {tokens.map((token) => (
          <span
            key={token}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-[#fff3d7] px-3 py-1 text-xs font-medium text-[#8a6a18]"
          >
            <span className="max-w-[220px] truncate">{token}</span>
            <button
              type="button"
              onClick={() => removeToken(token)}
              className="text-[#9b7b3f] transition-colors hover:text-[#6f5415]"
              aria-label={`Remove ${token}`}
            >
              ×
            </button>
          </span>
        ))}

        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={tokens.length === 0 ? placeholder : `Add another ${label.toLowerCase().slice(0, -1)}`}
          className="min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-[#a39170]"
        />
        <button
          type="button"
          disabled={!draft.trim()}
          onMouseDown={(event) => event.preventDefault()}
          onClick={commitDraft}
          className="shrink-0 rounded-full bg-[#1f170c] px-3 py-1.5 text-[11px] font-bold text-[#f6d48f] transition-colors hover:bg-[#3a2b10] disabled:cursor-not-allowed disabled:bg-[#e5dccb] disabled:text-[#9a8d77]"
        >
          Add
        </button>
      </div>
    </label>
  );
}

export function PostEditor({
  caption,
  hashtags,
  mentions,
  media,
  selectedMediaIds,
  editedMediaIds,
  selectedPlatforms,
  uploadError,
  editingMediaId,
  highlightedFixTargetId,
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onMediaSelectionToggle,
  onFilesSelected,
  onEditMedia,
}: Props) {
  const selectedPlatformLabels = selectedPlatforms
    .map((platform) => {
      if (platform === "twitter") return "X";
      if (platform === "google_business") return "Google Business";
      return platform.charAt(0).toUpperCase() + platform.slice(1).replace("_", " ");
    })
    .join(", ");

  return (
    <div className="flex h-full flex-col gap-4 p-4 overflow-y-auto">
      {selectedPlatforms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 rounded-2xl border border-[#eadfcb] bg-[#fffdf8]/95 px-3 py-2 shadow-sm backdrop-blur md:static md:z-auto"
        >
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
              Selected
            </span>
            {selectedPlatforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#eadfcb] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5d4a25]"
              >
                <PlatformLogo platform={platform} className="h-3.5 w-3.5" />
                {PLATFORM_LABELS[platform]}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* CAPTION CARD */}
      <motion.div
        id="compose-caption"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          rounded-2xl border border-[#eadfcb]
          bg-white/80 backdrop-blur p-4
          shadow-sm transition-all duration-200
          hover:shadow-md
        "
      >
        <div className="flex items-center justify-between">
          <label
            htmlFor="post-caption"
            className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]"
          >
            Caption
          </label>

          <span className="text-[10px] text-gray-400">
            {caption.length}/2200
          </span>
        </div>

        <textarea
          id="post-caption"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write your post caption..."
          className={`
            mt-2 w-full min-h-[140px] resize-none
            rounded-xl border border-[#eee3d0] bg-white/70 p-3 text-sm
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-[#d4a94f]/40 focus:border-[#d4a94f]
            ${highlightedFixTargetId === "post-caption" ? "border-[#d1ac63] bg-[#fff8dd] ring-2 ring-[#f7cc47]" : ""}
          `}
        />
      </motion.div>

      {/* TAG INPUTS */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <TokenInput
          id="post-hashtags"
          label="Hashtags"
          value={hashtags}
          onChange={onHashtagsChange}
          placeholder="#socialmedia"
          prefix="#"
        />

        <TokenInput
          id="post-mentions"
          label="Mentions"
          value={mentions}
          onChange={onMentionsChange}
          placeholder="@brandname"
          prefix="@"
        />
      </motion.div>

      {/* MEDIA CARD */}
      <motion.div
        id="compose-media"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`
          rounded-2xl border border-[#eadfcb]
          bg-white/80 backdrop-blur p-4
          shadow-sm transition-all duration-200
          hover:shadow-md
          ${highlightedFixTargetId === "compose-media" ? "border-[#d1ac63] ring-2 ring-[#f7cc47]" : ""}
        `}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
          Media
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7d7f88]">
          <span>Upload once, then polish each image with crop presets and safer framing.</span>
          {selectedPlatformLabels && (
            <span className="rounded-full bg-[#fff3d7] px-2.5 py-1 font-medium text-[#8a6a18]">
              Active channels: {selectedPlatformLabels}
            </span>
          )}
        </div>

        {/* DROPZONE */}
        <label
          className="
            mt-3 flex h-36 cursor-pointer flex-col items-center justify-center
            rounded-xl border-2 border-dashed border-[#e6dccb]
            bg-white/50 transition-all duration-200
            hover:border-[#d4a94f] hover:bg-[#fff9ef]
          "
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            className="text-2xl text-[#9b7b3f]"
          >
            +
          </motion.div>

          <span className="text-xs text-gray-500">
            Click or drag media
          </span>

          <input
            type="file"
            multiple
            hidden
            aria-label="Upload media files"
            onChange={(e) => onFilesSelected(e.target.files)}
          />
        </label>

        {/* UPLOAD ERROR */}
        {uploadError && (
          <p className="mt-2 text-xs text-red-500">{uploadError}</p>
        )}

        {/* MEDIA GRID */}
        {media.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            {media.map((m) => {
              const selected = selectedMediaIds.includes(m.id);
              const edited = editedMediaIds.includes(m.id);
              const isImage = m.file_type === "image";
              const isVideo = m.file_type === "video";

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onMediaSelectionToggle(m.id)}
                  role="checkbox"
                  aria-checked={selected}
                  aria-label={`Media item ${m.id}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      onMediaSelectionToggle(m.id);
                    }
                  }}
                  className={`
                    relative cursor-pointer overflow-hidden rounded-xl border
                    transition-all duration-200
                    ${selected
                      ? "ring-2 ring-[#d4a94f] shadow-md"
                      : "hover:shadow-sm"}
                  `}
                >
                  {isVideo ? (
                    <video
                      src={m.file_url}
                      className="h-24 w-full object-cover sm:h-24"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={m.file_url}
                      alt={m.alt_text ?? `Uploaded media ${m.id}`}
                      className="h-24 w-full object-cover sm:h-24"
                    />
                  )}

                  <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1.5">
                    {edited && (
                      <span className="rounded-full bg-[#111827]/78 px-2 py-1 text-[10px] font-semibold text-white">
                        Edited
                      </span>
                    )}
                    {m.alt_text && (
                      <span className="rounded-full bg-white/92 px-2 py-1 text-[10px] font-semibold text-[#5f6675]">
                        Alt text
                      </span>
                    )}
                  </div>

                  {isImage && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEditMedia(m);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-[rgba(17,24,39,0.78)] px-2 py-1 text-[10px] font-semibold text-white shadow-lg transition-colors hover:bg-[rgba(17,24,39,0.92)] sm:px-2.5 sm:py-1.5"
                    >
                      {editingMediaId === m.id ? "Opening..." : "Edit"}
                    </button>
                  )}

                  {/* SELECT OVERLAY */}
                  {selected && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center text-white text-xs">
                      Selected
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
