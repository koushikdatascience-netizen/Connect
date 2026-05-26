"use client";

import { motion } from "framer-motion";
import { MediaAsset, PlatformName } from "@/lib/types";

type Props = {
  caption: string;
  hashtags: string;
  mentions: string;
  altText: string;
  media: MediaAsset[];
  selectedMediaIds: number[];
  editedMediaIds: number[];
  selectedPlatforms: PlatformName[];
  uploadError: string | null;
  editingMediaId: number | null;

  onCaptionChange: (v: string) => void;
  onHashtagsChange: (v: string) => void;
  onMentionsChange: (v: string) => void;
  onAltTextChange: (v: string) => void;

  onMediaSelectionToggle: (id: number) => void;
  onFilesSelected: (files: FileList | null) => void;
  onEditMedia: (asset: MediaAsset) => void;
};

export function PostEditor({
  caption,
  hashtags,
  mentions,
  altText,
  media,
  selectedMediaIds,
  editedMediaIds,
  selectedPlatforms,
  uploadError,
  editingMediaId,
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onAltTextChange,
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
          className="
            mt-2 w-full min-h-[140px] resize-none
            rounded-xl border border-[#eee3d0] bg-white/70 p-3 text-sm
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-[#d4a94f]/40 focus:border-[#d4a94f]
          "
        />
      </motion.div>

      {/* TAG INPUTS */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 gap-3"
      >
        <input
          aria-label="Hashtags"
          value={hashtags}
          onChange={(e) => onHashtagsChange(e.target.value)}
          placeholder="#hashtags"
          className="
            h-10 rounded-xl border border-[#eee3d0] bg-white/70 px-3 text-sm
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-[#d4a94f]/40 focus:border-[#d4a94f]
          "
        />

        <input
          aria-label="Mentions"
          value={mentions}
          onChange={(e) => onMentionsChange(e.target.value)}
          placeholder="@mentions"
          className="
            h-10 rounded-xl border border-[#eee3d0] bg-white/70 px-3 text-sm
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-[#d4a94f]/40 focus:border-[#d4a94f]
          "
        />
      </motion.div>

      {/* MEDIA CARD */}
      <motion.div
        id="compose-media"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="
          rounded-2xl border border-[#eadfcb]
          bg-white/80 backdrop-blur p-4
          shadow-sm transition-all duration-200
          hover:shadow-md
        "
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
          <div className="mt-4 grid grid-cols-3 gap-3">
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
                      className="h-24 w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={m.file_url}
                      alt={m.alt_text ?? `Uploaded media ${m.id}`}
                      className="h-24 w-full object-cover"
                    />
                  )}

                  <div className="absolute left-2 top-2 flex gap-1.5">
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
                      className="absolute right-2 top-2 rounded-full bg-[rgba(17,24,39,0.78)] px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-lg transition-colors hover:bg-[rgba(17,24,39,0.92)]"
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

      {/* ALT TEXT */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="
          rounded-xl border border-[#eadfcb]
          bg-white/80 backdrop-blur p-3
        "
      >
        <label className="block">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
            Upload Alt Text
          </div>
          <input
            aria-label="Default alt text for next upload"
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder="Optional default alt text for the next upload"
            className="
              w-full bg-transparent text-sm outline-none
            "
          />
          <p className="mt-2 text-xs text-[#7d7f88]">
            Use the image editor for per-asset alt text after upload.
          </p>
        </label>
      </motion.div>
    </div>
  );
}
