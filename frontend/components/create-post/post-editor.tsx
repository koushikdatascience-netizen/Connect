"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MediaAsset, PlatformName } from "@/lib/types";

type Props = {
  caption: string;
  hashtags: string;
  mentions: string;
  altText: string;
  media: MediaAsset[];
  selectedMediaIds: number[];
  selectedPlatforms: PlatformName[];
  previewEnabled: boolean;
  aiPanelOpen: boolean;
  uploading: boolean;
  onCaptionChange: (value: string) => void;
  onHashtagsChange: (value: string) => void;
  onMentionsChange: (value: string) => void;
  onAltTextChange: (value: string) => void;
  onMediaSelectionToggle: (mediaId: number) => void;
  onFilesSelected: (files: FileList | null) => void;
};

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  if (asset.file_type === "image") {
    return (
      <img
        src={asset.file_url}
        alt={asset.alt_text || "media"}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs">
      {asset.file_type}
    </div>
  );
}

export function PostEditor({
  caption,
  hashtags,
  mentions,
  media,
  selectedMediaIds,
  uploading,
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onMediaSelectionToggle,
  onFilesSelected,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const selectedMedia = media.filter((m) =>
    selectedMediaIds.includes(m.id)
  );

  const charLimit = 2200;

  /* ---------------- HANDLERS ---------------- */

  function autoResize(e: any) {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    onFilesSelected(event.dataTransfer.files);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(event.target.files);
    event.target.value = "";
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="flex flex-col gap-4 p-4">

      {/* CAPTION */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-4"
      >
        <label className="text-xs font-semibold text-gray-500 mb-2 block">
          Caption
        </label>

        <textarea
          ref={textareaRef}
          value={caption}
          onChange={(e) => {
            onCaptionChange(e.target.value);
            autoResize(e);
          }}
          placeholder="Write your post..."
          className="w-full resize-none bg-transparent text-sm outline-none min-h-[80px] max-h-[160px]"
        />

        <div className="mt-2 text-xs text-gray-400">
          {caption.length}/{charLimit}
        </div>
      </motion.div>

      {/* HASHTAGS */}
      <motion.input
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        value={hashtags}
        onChange={(e) => onHashtagsChange(e.target.value)}
        placeholder="#hashtags"
        className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black/20"
      />

      {/* MENTIONS */}
      <motion.input
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        value={mentions}
        onChange={(e) => onMentionsChange(e.target.value)}
        placeholder="@mentions"
        className="rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-black/20"
      />

      {/* MEDIA */}
      <motion.div
        layout
        className="rounded-2xl border p-4"
      >
        <label className="text-xs font-semibold text-gray-500 mb-3 block">
          Media
        </label>

        {/* MEDIA GRID */}
        <AnimatePresence>
          {selectedMedia.length > 0 && (
            <motion.div
              layout
              className="mb-4 grid grid-cols-3 gap-2"
            >
              {selectedMedia.map((asset) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative h-[90px] rounded-lg overflow-hidden border"
                >
                  <MediaThumbnail asset={asset} />

                  <button
                    onClick={() => onMediaSelectionToggle(asset.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* UPLOAD BOX */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex h-[120px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition ${
            dragActive ? "bg-black/5 border-black" : "hover:bg-gray-50"
          }`}
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <span className="text-xl">+</span>
              <span className="text-xs">
                Click or drag media
              </span>
            </>
          )}
        </motion.div>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInput}
          className="hidden"
        />
      </motion.div>
    </div>
  );
}