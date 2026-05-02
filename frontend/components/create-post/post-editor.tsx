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
        alt={asset.alt_text || "Uploaded media"}
        className="h-[120px] w-[120px] rounded-[18px] object-cover"
      />
    );
  }

  return (
    <div className="flex h-[120px] w-[120px] items-center justify-center rounded-[18px] bg-[#f4ecdd] text-xs font-medium uppercase text-[#8d8274]">
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
      <div className="rounded-[28px] border border-[#eadfcb] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(36,24,6,0.06)]">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[#8d8274]">
          Caption
        </label>
        <div className="relative rounded-[24px] border border-[#e9decb] bg-[#fffdfa] p-4">
          <textarea
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Write your post caption here..."
            className="min-h-[220px] w-full resize-none bg-transparent text-[15px] leading-7 text-[#241b10] outline-none placeholder:text-[#b3a99d]"
          />
          {/* Bottom toolbar */}
          <div className="mt-4 flex items-center justify-between border-t border-[#efe6d7] pt-3">
            <div className="flex items-center gap-3">
              <button type="button" className="rounded-full p-2 text-[#9b8d79] transition hover:bg-[#f5eee2] hover:text-[#6f5316]" title="Emoji">
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                  <path d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25 3.25a.75.75 0 0 0-1.5 0A2.25 2.25 0 0 1 9 13.5a2.25 2.25 0 0 1-2.25-2.25.75.75 0 0 0-1.5 0A3.75 3.75 0 0 0 9 15a3.75 3.75 0 0 0 3.75-3.75Z" />
                </svg>
              </button>
              <button type="button" className="rounded-full p-2 text-[#9b8d79] transition hover:bg-[#f5eee2] hover:text-[#6f5316]" title="Hashtag">
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                  <path d="M9.25 2a.75.75 0 0 1 .75.75v.5h3.5v-.5a.75.75 0 0 1 1.5 0v.5h.25A1.75 1.75 0 0 1 17 5v.25h.5a.75.75 0 0 1 0 1.5H17V10h.5a.75.75 0 0 1 0 1.5H17V15a1.75 1.75 0 0 1-1.75 1.75h-10.5A1.75 1.75 0 0 1 3 15v-3.5h-.5a.75.75 0 0 1 0-1.5H3V6.75h-.5a.75.75 0 0 1 0-1.5H3V5A1.75 1.75 0 0 1 4.75 3.25H5v-.5A.75.75 0 0 1 5.75 2H7v.5h2.25V2Zm-4.5 2.75h10.5a.25.25 0 0 1 .25.25v10a.25.25 0 0 1-.25.25h-10.5A.25.25 0 0 1 4.5 15V5a.25.25 0 0 1 .25-.25Z" />
                </svg>
              </button>
              <button type="button" className="rounded-full p-2 text-[#9b8d79] transition hover:bg-[#f5eee2] hover:text-[#6f5316]" title="Mention">
                <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                  <path d="M10 2a8 8 0 0 1 8 8c0 3-2 5-4.5 5-.9 0-1.7-.35-2.3-.9A3.5 3.5 0 0 1 5 11.5a3.5 3.5 0 0 1 5.95-2.48.75.75 0 0 1 1.5-.02v2.5c0 .83.67 1.5 1.5 1.5C15 13 16.5 11.5 16.5 10a6.5 6.5 0 1 0-6.5 6.5h.5a.75.75 0 0 1 0 1.5H10A8 8 0 0 1 10 2Zm-2 9.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
                </svg>
              </button>
            </div>
            <span className="text-[11px] font-medium text-[#9b8f7b]">
              {caption.length} / {charLimit}
            </span>
          </div>
        </div>

        {/* AI assist panel */}
        {aiPanelOpen && (
          <div className="mt-4 rounded-[22px] border border-[#ead9b1] bg-[linear-gradient(135deg,#fff8e7_0%,#fffaf1_100%)] p-4">
            <div className="mb-3 flex items-center gap-2">
              <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current text-[#b8871a]">
                <path d="M8 1a.75.75 0 0 1 .75.75v.5h.5A1.75 1.75 0 0 1 11 4v1.75h.75a.75.75 0 0 1 0 1.5H11V9.5a1.75 1.75 0 0 1-1.75 1.75H8.75v.5a.75.75 0 0 1-1.5 0v-.5H6.75A1.75 1.75 0 0 1 5 9.5V7.25h-.75a.75.75 0 0 1 0-1.5H5V4A1.75 1.75 0 0 1 6.75 2.25h.5v-.5A.75.75 0 0 1 8 1Z" />
              </svg>
              <span className="text-xs font-semibold text-[#805d17]">AI Assist</span>
              <span className="text-xs text-[#aa9264]">Enhance your post for better engagement.</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "tighten" as const, label: "Tighten copy" },
                { id: "cta" as const, label: "Add CTA" },
                { id: "hashtags" as const, label: "Suggest hashtags" },
              ].map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => startTransition(() => onApplyAiAssist(action.id))}
                  className="rounded-full border border-[#dec58d] bg-white px-3 py-1.5 text-xs font-medium text-[#7a5919] hover:bg-[#fff1cb]"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Media */}
      <div className="rounded-[28px] border border-[#eadfcb] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(36,24,6,0.06)]">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-[#8d8274]">
          Media
        </label>

        <div className="flex flex-wrap gap-3">
          {/* Existing media thumbnails */}
          {media
            .filter((asset) => selectedMediaIds.includes(asset.id))
            .map((asset) => (
              <div key={asset.id} className="relative overflow-hidden rounded-[22px] border border-[#e6dcc8] bg-[#fffdfa] p-1 shadow-[0_10px_24px_rgba(36,24,6,0.05)]">
                <MediaThumbnail asset={asset} />
                <button
                  type="button"
                  onClick={() => onMediaSelectionToggle(asset.id, false)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-[#5f5444] shadow transition hover:bg-white hover:text-[#1f170c]"
                >
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-current">
                    <path d="M2.22 2.22a.75.75 0 0 1 1.06 0L6 4.94l2.72-2.72a.75.75 0 1 1 1.06 1.06L7.06 6l2.72 2.72a.75.75 0 1 1-1.06 1.06L6 7.06 3.28 9.78a.75.75 0 0 1-1.06-1.06L4.94 6 2.22 3.28a.75.75 0 0 1 0-1.06Z" />
                  </svg>
                </button>
              </div>
            ))}

          {/* Upload button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex h-[130px] w-[130px] flex-col items-center justify-center gap-2 rounded-[24px] border border-dashed border-[#d8c9ab] bg-[#fffaf0] text-[#9c8d78] transition hover:border-[#bc9442] hover:bg-[#fff5df]"
          >
            {uploading ? (
              <div className="text-xs font-medium">Uploading...</div>
            ) : (
              <>
                <svg viewBox="0 0 20 20" className="h-7 w-7 fill-current text-[#b7985f]">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                <span className="text-center text-[12px] font-medium leading-tight text-[#6f5d3d]">
                  Add photos<br />or videos
                </span>
                <span className="text-[10px] text-[#b3a489]">or drag and drop</span>
              </>
            )}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleInput}
          className="hidden"
        />

        {/* Non-selected media from library */}
        {media.filter((asset) => !selectedMediaIds.includes(asset.id)).length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[11px] text-gray-400">From library — click to add</p>
            <div className="flex flex-wrap gap-2">
              {media
                .filter((asset) => !selectedMediaIds.includes(asset.id))
                .map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onMediaSelectionToggle(asset.id, true)}
                    className="relative overflow-hidden rounded-lg opacity-50 transition hover:opacity-100"
                  >
                    <MediaThumbnail asset={asset} />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Hashtags */}
      <div className="rounded-[28px] border border-[#eadfcb] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(36,24,6,0.06)]">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d8274]">Hashtags</label>
          <span className="text-[10px] text-gray-400">· Optional</span>
        </div>
        <div className="relative">
          <input
            value={hashtags}
            onChange={(e) => onHashtagsChange(e.target.value)}
            placeholder="Add hashtags..."
            className="w-full rounded-[18px] border border-[#e7dcc9] bg-[#fffdfa] px-4 py-3 pr-10 text-sm text-[#241b10] outline-none placeholder:text-[#b3a99d] focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb]"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c2b49c]">
            <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
              <path d="M6.5 2.75a.75.75 0 0 0-1.5 0V5H2.75a.75.75 0 0 0 0 1.5H5v2.5H2.75a.75.75 0 0 0 0 1.5H5v2.25a.75.75 0 0 0 1.5 0V10.5h2.5v2.25a.75.75 0 0 0 1.5 0V10.5h2.25a.75.75 0 0 0 0-1.5H10.5V6.5h2.25a.75.75 0 0 0 0-1.5H10.5V2.75a.75.75 0 0 0-1.5 0V5h-2.5V2.75ZM6.5 6.5h2.5V9H6.5V6.5Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mentions */}
      <div className="rounded-[28px] border border-[#eadfcb] bg-white px-6 py-6 shadow-[0_18px_50px_rgba(36,24,6,0.06)]">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8d8274]">Mentions</label>
          <span className="text-[10px] text-gray-400">· Optional</span>
        </div>
        <div className="relative">
          <input
            value={mentions}
            onChange={(e) => onMentionsChange(e.target.value)}
            placeholder="Add mentions..."
            className="w-full rounded-[18px] border border-[#e7dcc9] bg-[#fffdfa] px-4 py-3 pr-10 text-sm text-[#241b10] outline-none placeholder:text-[#b3a99d] focus:border-[#d1ac63] focus:ring-2 focus:ring-[#f7ebcb]"
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#c2b49c]">
            <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
              <path d="M8 2a6 6 0 0 1 6 6c0 2.25-1.5 3.75-3.375 3.75-.675 0-1.275-.263-1.725-.675A2.625 2.625 0 0 1 3.5 8.625a2.625 2.625 0 0 1 4.463-1.86.563.563 0 0 1 1.162-.015v1.875c0 .622.503 1.125 1.125 1.125C11.25 9.75 12.5 8.25 12.5 7a4.5 4.5 0 1 0-4.5 4.5H8.5a.563.563 0 1 1 0 1.125H8A5.625 5.625 0 1 1 8 2Zm-1.5 6.625a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Note */}
      {selectedPlatforms.length > 1 && (
        <div className="border-t border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current text-amber-400 shrink-0">
              <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm9-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 10a.75.75 0 0 1 .75-.75h.75V8.75H7.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 .75.75v2.25h.25a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z" />
            </svg>
            These details will be applied to all selected platforms.
          </div>
        </div>
      )}
    </div>
  );
}
