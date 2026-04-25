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
    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.06)] text-[10px] font-medium uppercase text-[rgba(255,255,255,0.5)]">
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
  aiPanelOpen,
  uploading,
  onCaptionChange,
  onHashtagsChange,
  onMentionsChange,
  onAltTextChange,
  onMediaSelectionToggle,
  onFilesSelected,
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

  return (
    <section className="bg-[#0d0d0d] px-6 py-5">
      <div className="flex items-center gap-2">
        <span className="rounded-[4px] bg-[rgba(56,139,253,0.12)] px-2 py-[3px] text-[10px] font-medium uppercase tracking-[1px] text-[#58a6ff]">
          Step 1
        </span>
        <h2 className="text-[16px] font-medium text-white">Create the core post</h2>
        <button
          type="button"
          onClick={onAiPanelToggle}
          className="ml-auto rounded-md border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-[11px] text-[rgba(255,255,255,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:text-white"
        >
          AI assist
        </button>
      </div>

      <p className="mb-4 mt-3 text-[12px] leading-[1.5] text-[rgba(255,255,255,0.45)]">
        Draft the core message here, attach media, and keep the rest of the experience focused on the platforms you actually selected.
      </p>

      <div
        className={`grid transition-all duration-200 ${
          aiPanelOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr] pb-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] p-3 sm:grid-cols-3">
            {AI_ASSIST_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  startTransition(() => onApplyAiAssist(action.id));
                }}
                className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0d0d0d] p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]"
              >
                <div className="text-[12px] font-medium text-white">{action.label}</div>
                <div className="mt-1 text-[10px] leading-[1.5] text-[rgba(255,255,255,0.45)]">
                  {action.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-medium tracking-[0.5px] text-[rgba(255,255,255,0.4)]">
          CAPTION
        </label>
        <textarea
          value={caption}
          onChange={(event) => onCaptionChange(event.target.value)}
          placeholder="Write your post copy here. Keep it clear, then tailor each platform only when needed."
          className="h-[100px] w-full resize-none rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 py-3 text-[13px] leading-[1.6] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)]"
        />
        <div className="mb-3.5 mt-1 flex items-center justify-between text-[10px] text-[rgba(255,255,255,0.3)]">
          <span>{caption.length} characters</span>
          <span>Supports one-to-many publishing</span>
        </div>
      </div>

      <div className="mb-3.5 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[10px] font-medium tracking-[0.5px] text-[rgba(255,255,255,0.4)]">
            HASHTAGS
          </label>
          <input
            value={hashtags}
            onChange={(event) => onHashtagsChange(event.target.value)}
            placeholder="#launch, #growth"
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 py-[9px] text-[12px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-medium tracking-[0.5px] text-[rgba(255,255,255,0.4)]">
            MENTIONS
          </label>
          <input
            value={mentions}
            onChange={(event) => onMentionsChange(event.target.value)}
            placeholder="@partner, @brand"
            className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 py-[9px] text-[12px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-medium tracking-[0.5px] text-[rgba(255,255,255,0.4)]">
          MEDIA
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="w-full rounded-[10px] border-[1.5px] border-dashed border-[rgba(255,255,255,0.12)] bg-[#1a1a1a] px-5 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(255,255,255,0.04)]"
        >
          <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-[8px] bg-[rgba(255,255,255,0.06)] text-[14px] text-[rgba(255,255,255,0.5)]">
            ^
          </span>
          <span className="mt-2 block text-[12px] text-[rgba(255,255,255,0.5)]">
            {uploading ? "Uploading files..." : "Drop files here or click to upload"}
          </span>
          <span className="mt-1 block text-[10px] text-[rgba(255,255,255,0.3)]">
            Images and videos supported
          </span>
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

      <div className="mt-4">
        <label className="mb-1.5 block text-[10px] font-medium tracking-[0.5px] text-[rgba(255,255,255,0.4)]">
          ALT TEXT
        </label>
        <input
          value={altText}
          onChange={(event) => onAltTextChange(event.target.value)}
          placeholder="Optional description applied while uploading"
          className="w-full rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] px-3 py-[9px] text-[12px] text-white outline-none placeholder:text-[rgba(255,255,255,0.35)]"
        />
      </div>

      <div className="mt-4 space-y-2">
        {media.length
          ? media.map((asset) => {
              const checked = selectedMediaIds.includes(asset.id);
              return (
                <label
                  key={asset.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-[10px] border p-3 transition-all duration-200 ${
                    checked
                      ? "border-[rgba(245,200,0,0.45)] bg-[rgba(255,255,255,0.04)]"
                      : "border-[rgba(255,255,255,0.08)] bg-[#1a1a1a] hover:bg-[rgba(255,255,255,0.04)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onMediaSelectionToggle(asset.id, event.target.checked)}
                    className="h-4 w-4 rounded-[4px] border-[1.5px] border-[rgba(255,255,255,0.2)] bg-transparent text-[#F5C800] focus:ring-0"
                  />
                  <MediaThumbnail asset={asset} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-medium text-white">
                      {asset.alt_text || `Media #${asset.id}`}
                    </div>
                    <div className="mt-1 text-[10px] text-[rgba(255,255,255,0.35)]">
                      {asset.file_type.toUpperCase()}
                    </div>
                  </div>
                </label>
              );
            })
          : null}
      </div>
    </section>
  );
}

