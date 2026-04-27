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

const AI_ASSIST_ACTIONS: Array<{
  id: "tighten" | "cta" | "hashtags";
  label: string;
  description: string;
}> = [
  { id: "tighten", label: "Tighten copy", description: "Make the caption more concise and skimmable." },
  { id: "cta", label: "Add CTA", description: "Append a lightweight action-oriented ending." },
  { id: "hashtags", label: "Suggest hashtags", description: "Add a few relevant hashtags based on the caption." },
];

function MediaThumbnail({ asset }: { asset: MediaAsset }) {
  if (asset.file_type === "image") {
    return (
      <img
        src={asset.file_url}
        alt={asset.alt_text || "Uploaded media"}
        className="h-10 w-10 rounded-[8px] object-cover"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#fff2b8] text-[10px] font-semibold uppercase text-[#5b4500]">
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
  const selectedMediaCount = selectedMediaIds.length;

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    onFilesSelected(event.dataTransfer.files);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    onFilesSelected(event.target.files);
    event.target.value = "";
  }

  return (
    <section className="bg-[#fffdf8] px-4 py-4 sm:px-6 sm:py-6">
      <div className="rounded-[24px] border border-[#f0e2b2] bg-[#fffef9] p-4 shadow-[0_12px_30px_rgba(180,144,34,0.06)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-[4px] bg-[rgba(56,139,253,0.12)] px-2 py-[3px] text-[10px] font-medium uppercase tracking-[1px] text-[#58a6ff]">
                Step 1
              </span>
              <h2 className="text-[16px] font-semibold text-[#111111]">Create the core post</h2>
            </div>
            <p className="mt-3 text-[12px] leading-[1.5] text-[#344054]">
              Draft the main message once, then adapt only the details each selected platform actually needs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#f0e2b2] bg-[#fff7d1] px-3 py-1 text-[11px] font-medium text-[#5b4500]">
              {selectedPlatforms.length} platform{selectedPlatforms.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={onPreviewToggle}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-200 ${
                previewEnabled
                  ? "border-[#e5ca61] bg-[#ffe98e] text-[#5b4500]"
                  : "border-[#eadba6] bg-[#fffef9] text-[#344054]"
              }`}
            >
              {previewEnabled ? "Preview on" : "Preview off"}
            </button>
            <button
              type="button"
              onClick={onAiPanelToggle}
              className="rounded-lg border border-[#eadba6] bg-[#fff7d1] px-2.5 py-1 text-[11px] font-medium text-[#5b4500] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#d8c36e] hover:text-[#111111]"
            >
              AI assist
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#f0e2b2] bg-[#fffdf8] p-4">
              <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.5px] text-[#8c6f00]">
                CAPTION
              </label>
              <textarea
                value={caption}
                onChange={(event) => onCaptionChange(event.target.value)}
                placeholder="Write your post copy here. Keep it clear, then tailor each platform only when needed."
                className="h-[180px] w-full resize-none rounded-2xl border border-[#eadba6] bg-[#fffef9] px-4 py-3 text-[13px] leading-[1.6] text-[#111111] outline-none transition-all duration-200 placeholder:text-[#6b7280] focus:border-[#F5C800] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,200,0,0.16)]"
              />
              <div className="mt-2 flex flex-col gap-1 text-[10px] text-[#344054] sm:flex-row sm:items-center sm:justify-between">
                <span>{caption.length} characters</span>
                <span>Supports one-to-many publishing</span>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#f0e2b2] bg-[#fffdf8] p-4">
                <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.5px] text-[#8c6f00]">
                  HASHTAGS
                </label>
                <input
                  value={hashtags}
                  onChange={(event) => onHashtagsChange(event.target.value)}
                  placeholder="#launch, #growth"
                  className="w-full rounded-2xl border border-[#eadba6] bg-[#fffef9] px-3 py-[9px] text-[12px] text-[#111111] outline-none transition-all duration-200 placeholder:text-[#6b7280] focus:border-[#F5C800] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,200,0,0.16)]"
                />
              </div>

              <div className="rounded-2xl border border-[#f0e2b2] bg-[#fffdf8] p-4">
                <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.5px] text-[#8c6f00]">
                  MENTIONS
                </label>
                <input
                  value={mentions}
                  onChange={(event) => onMentionsChange(event.target.value)}
                  placeholder="@partner, @brand"
                  className="w-full rounded-2xl border border-[#eadba6] bg-[#fffef9] px-3 py-[9px] text-[12px] text-[#111111] outline-none transition-all duration-200 placeholder:text-[#6b7280] focus:border-[#F5C800] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,200,0,0.16)]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#f0e2b2] bg-[#fffdf8] p-4">
              <label className="mb-1.5 block text-[10px] font-semibold tracking-[0.5px] text-[#8c6f00]">
                ALT TEXT
              </label>
              <input
                value={altText}
                onChange={(event) => onAltTextChange(event.target.value)}
                placeholder="Optional description applied while uploading"
                className="w-full rounded-2xl border border-[#eadba6] bg-[#fffef9] px-3 py-[9px] text-[12px] text-[#111111] outline-none transition-all duration-200 placeholder:text-[#6b7280] focus:border-[#F5C800] focus:bg-white focus:shadow-[0_0_0_4px_rgba(245,200,0,0.16)]"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div
              className={`grid transition-all duration-200 ${
                aiPanelOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="rounded-2xl border border-[#f0e2b2] bg-[#fff8dc] p-4">
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.5px] text-[#8c6f00]">
                    AI ACTIONS
                  </div>
                  <div className="grid gap-3">
                    {AI_ASSIST_ACTIONS.map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => {
                          startTransition(() => onApplyAiAssist(action.id));
                        }}
                        className="rounded-xl border border-[#eadba6] bg-[#fffef9] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#efcf59] hover:bg-[#fff7d1]"
                      >
                        <div className="text-[12px] font-semibold text-[#111111]">{action.label}</div>
                        <div className="mt-1 text-[10px] leading-[1.5] text-[#344054]">
                          {action.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#f0e2b2] bg-[#fffdf8] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="block text-[10px] font-semibold tracking-[0.5px] text-[#8c6f00]">
                  MEDIA
                </label>
                <span className="rounded-full border border-[#e5ca61] bg-[#ffe98e] px-2.5 py-1 text-[10px] font-semibold text-[#5b4500]">
                  {selectedMediaCount} selected
                </span>
              </div>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
                className="w-full rounded-2xl border-[1.5px] border-dashed border-[#e5ca61] bg-[#fffef9] px-5 py-8 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F5C800] hover:bg-[#fff7d1]"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#fff2b8] text-[16px] font-semibold text-[#5b4500]">
                  ^
                </span>
                <span className="mt-3 block text-[12px] font-medium text-[#1f2937]">
                  {uploading ? "Uploading files..." : "Drop files here or click to upload"}
                </span>
                <span className="mt-1 block text-[10px] text-[#344054]">
                  Images and videos supported
                </span>
              </button>

              <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleInput}
                className="hidden"
              />

              <div className="mt-4 space-y-2">
                {media.length
                  ? media.map((asset) => {
                      const checked = selectedMediaIds.includes(asset.id);
                      return (
                        <label
                          key={asset.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 transition-all duration-200 ${
                            checked
                              ? "border-[#efcf59] bg-[#fff2b8]"
                              : "border-[#f0e2b2] bg-[#fffef9] hover:bg-[#fff7d1]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => onMediaSelectionToggle(asset.id, event.target.checked)}
                            className="h-4 w-4 rounded-[4px] border-[1.5px] border-[#d8c36e] bg-white text-[#F5C800] focus:ring-0"
                          />
                          <MediaThumbnail asset={asset} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12px] font-semibold text-[#111111]">
                              {asset.alt_text || `Media #${asset.id}`}
                            </div>
                            <div className="mt-1 text-[10px] text-[#344054]">
                              {asset.file_type.toUpperCase()}
                            </div>
                          </div>
                        </label>
                      );
                    })
                  : (
                    <div className="rounded-xl border border-dashed border-[#f0e2b2] bg-[#fffef9] px-4 py-5 text-center text-[11px] text-[#344054]">
                      No media in the library yet. Upload files to start building the post.
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
