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
  selectedPlatforms: PlatformName[];
  uploadError: string | null;

  onCaptionChange: (v: string) => void;
  onHashtagsChange: (v: string) => void;
  onMentionsChange: (v: string) => void;
  onAltTextChange: (v: string) => void;

  onMediaSelectionToggle: (id: number) => void;
  onFilesSelected: (files: FileList | null) => void;
};

export function PostEditor({
  caption,
  hashtags,
  mentions,
  altText,
  media,
  selectedMediaIds,
  selectedPlatforms,
  uploadError,
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onAltTextChange,
  onMediaSelectionToggle,
  onFilesSelected,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-4 p-4 overflow-y-auto">

      {/* CAPTION CARD */}
      <motion.div
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
                  <img
                    src={m.file_url}
                    alt={m.alt_text ?? `Uploaded media ${m.id}`}
                    className="h-24 w-full object-cover"
                  />

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
        <input
          aria-label="Alt text for media"
          value={altText}
          onChange={(e) => onAltTextChange(e.target.value)}
          placeholder="Alt text (optional)"
          className="
            w-full bg-transparent text-sm outline-none
          "
        />
      </motion.div>
    </div>
  );
}