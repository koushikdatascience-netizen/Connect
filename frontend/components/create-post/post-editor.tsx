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
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onAltTextChange,
  onMediaSelectionToggle,
  onFilesSelected,
}: Props) {
  return (
    <div className="flex flex-col gap-4">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border bg-white px-5 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)]"
      >
        <h1 className="text-lg font-semibold text-[#1f170c]">
          Create your post
        </h1>
        <p className="text-xs text-[#8a7b65]">
          Write once, publish everywhere
        </p>
      </motion.div>

      {/* CAPTION */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border bg-white p-4 shadow-sm"
      >
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
          Caption
        </label>

        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write your post caption..."
          className="
            mt-2 w-full min-h-[140px] resize-none rounded-xl border p-3 text-sm
            outline-none transition-all duration-200
            focus:ring-1 focus:ring-[#d1ac63]
          "
        />

        <div className="mt-1 text-right text-[10px] text-gray-400">
          {caption.length}/2200
        </div>
      </motion.div>

      {/* TAG INPUTS */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-3"
      >
        {/* HASHTAGS */}
        <input
          value={hashtags}
          onChange={(e) => onHashtagsChange(e.target.value)}
          placeholder="#hashtags"
          className="
            h-10 rounded-xl border px-3 text-sm
            outline-none transition-all duration-200
            focus:ring-1 focus:ring-[#d1ac63]
          "
        />

        {/* MENTIONS */}
        <input
          value={mentions}
          onChange={(e) => onMentionsChange(e.target.value)}
          placeholder="@mentions"
          className="
            h-10 rounded-xl border px-3 text-sm
            outline-none transition-all duration-200
            focus:ring-1 focus:ring-[#d1ac63]
          "
        />
      </motion.div>

      {/* MEDIA UPLOADER */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border bg-white p-4 shadow-sm"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9b7b3f]">
          Media
        </p>

        {/* DROPZONE */}
        <label
          className="
            mt-3 flex h-32 cursor-pointer flex-col items-center justify-center
            rounded-xl border-2 border-dashed
            transition-all duration-200
            hover:border-[#d1ac63] hover:bg-[#fffaf3]
          "
        >
          <span className="text-xl">＋</span>
          <span className="text-xs text-gray-500">
            Click or drag media
          </span>

          <input
            type="file"
            multiple
            hidden
            onChange={(e) => onFilesSelected(e.target.files)}
          />
        </label>

        {/* MEDIA PREVIEW */}
        {media.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {media.map((m) => {
              const selected = selectedMediaIds.includes(m.id);

              return (
                <motion.div
                  key={m.id}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onMediaSelectionToggle(m.id)}
                  className={`
                    relative cursor-pointer overflow-hidden rounded-lg border
                    ${selected ? "ring-2 ring-[#d4a94f]" : ""}
                  `}
                >
                  <img
                    src={m.url}
                    className="h-20 w-full object-cover"
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ALT TEXT */}
      <motion.input
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        value={altText}
        onChange={(e) => onAltTextChange(e.target.value)}
        placeholder="Alt text (optional)"
        className="
          h-10 rounded-xl border px-3 text-sm
          outline-none transition-all duration-200
          focus:ring-1 focus:ring-[#d1ac63]
        "
      />
    </div>
  );
}