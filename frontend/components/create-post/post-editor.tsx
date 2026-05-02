"use client";

import { ChangeEvent, DragEvent, startTransition, useRef } from "react";
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
  onMediaSelectionToggle: (mediaId: number, enabled: boolean) => void;
  onFilesSelected: (files: FileList | null) => void;
  onPreviewToggle: () => void;
  onAiPanelToggle: () => void;
  onApplyAiAssist: (mode: "tighten" | "cta" | "hashtags") => void;
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
    <div className="flex h-full w-full items-center justify-center bg-[#f4ecdd] text-xs text-[#8d8274]">
      {asset.file_type}
    </div>
  );
}

export function PostEditor({
  caption,
  hashtags,
  mentions,
  altText,
  media,
  selectedMediaIds,
  selectedPlatforms,
  previewEnabled,
  aiPanelOpen,
  uploading,
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onAltTextChange,
  onMediaSelectionToggle,
  onFilesSelected,
  onPreviewToggle,
  onAiPanelToggle,
  onApplyAiAssist,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selectedMedia = media.filter((m) =>
    selectedMediaIds.includes(m.id)
  );

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    onFilesSelected(event.dataTransfer.files);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(event.target.files);
    event.target.value = "";
  }

  const charLimit = 2200;

  return (
    <div className="flex flex-col gap-4 p-3">

      {/* Caption */}
      <div className="rounded-xl border border-[#eee3d0] bg-white p-4">
        <label className="text-xs font-semibold text-[#8d8274] mb-2 block">
          Caption
        </label>

        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          placeholder="Write your post..."
          className="min-h-[180px] w-full resize-none bg-transparent text-sm outline-none"
        />

        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>{caption.length}/{charLimit}</span>
        </div>
      </div>

      {/* MEDIA (FIXED CLEAN VERSION) */}
      <div className="rounded-xl border border-[#eee3d0] bg-white p-4">
        <label className="text-xs font-semibold text-[#8d8274] mb-3 block">
          Media
        </label>

        {/* Selected Media */}
        {selectedMedia.length > 0 && (
          <div className="mb-4">
            <p className="text-[11px] text-gray-400 mb-2">
              Selected media
            </p>

            <div className="flex gap-2 overflow-x-auto">
              {selectedMedia.map((asset) => (
                <div
                  key={asset.id}
                  className="relative h-[90px] w-[90px] shrink-0 rounded-lg overflow-hidden border"
                >
                  <MediaThumbnail asset={asset} />

                  <button
                    onClick={() =>
                      onMediaSelectionToggle(asset.id, false)
                    }
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex h-[110px] w-[110px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-gray-500 hover:bg-gray-50"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <span className="text-lg">+</span>
              <span className="text-xs text-center">
                Add media
              </span>
            </>
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleInput}
          className="hidden"
        />
      </div>

      {/* Hashtags */}
      <input
        value={hashtags}
        onChange={(e) => onHashtagsChange(e.target.value)}
        placeholder="Hashtags..."
        className="rounded-lg border p-3 text-sm"
      />

      {/* Mentions */}
      <input
        value={mentions}
        onChange={(e) => onMentionsChange(e.target.value)}
        placeholder="Mentions..."
        className="rounded-lg border p-3 text-sm"
      />

    </div>
  );
}