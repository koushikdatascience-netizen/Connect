"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PLATFORM_LABELS } from "@/components/create-post/constants";
import { MediaAsset, PlatformName } from "@/lib/types";

type CropAspect = "free" | "original" | "square" | "portrait" | "landscape" | "story";

type SavePayload = {
  blob: Blob;
  altText: string;
  fileName: string;
  mimeType: string;
};

type Props = {
  asset: MediaAsset | null;
  open: boolean;
  saving: boolean;
  selectedPlatforms: PlatformName[];
  onClose: () => void;
  onSave: (payload: SavePayload) => Promise<void> | void;
};

type RenderSettings = {
  rotation: number;
  zoom: number;
  panX: number;
  panY: number;
  aspect: CropAspect;
  freeWidth: number;
  freeHeight: number;
};

type Preset = {
  id: string;
  label: string;
  description: string;
  aspect: CropAspect;
  zoom?: number;
  recommendedFor?: PlatformName[];
};

type PreviewMeta = {
  width: number;
  height: number;
  mimeType: string;
};

const ASPECT_OPTIONS: { id: CropAspect; label: string; hint: string }[] = [
  { id: "free", label: "Free", hint: "Adjust width and height independently" },
  { id: "original", label: "Original", hint: "Keep the native image ratio" },
  { id: "square", label: "1:1", hint: "Clean feed crop" },
  { id: "portrait", label: "4:5", hint: "Instagram feed favorite" },
  { id: "landscape", label: "16:9", hint: "YouTube and wide layouts" },
  { id: "story", label: "9:16", hint: "Stories and vertical reels" },
];

const QUICK_PRESETS: Preset[] = [
  {
    id: "feed",
    label: "Instagram Feed",
    description: "Balanced portrait crop with stronger subject focus.",
    aspect: "portrait",
    zoom: 1.12,
    recommendedFor: ["instagram", "facebook"],
  },
  {
    id: "story",
    label: "Story / Reel",
    description: "Tall mobile framing for full-screen viewing.",
    aspect: "story",
    zoom: 1.18,
    recommendedFor: ["instagram", "facebook", "youtube"],
  },
  {
    id: "youtube",
    label: "YouTube Wide",
    description: "16:9 crop that feels comfortable for thumbnails and video cover art.",
    aspect: "landscape",
    zoom: 1.04,
    recommendedFor: ["youtube"],
  },
  {
    id: "square",
    label: "Square Social",
    description: "Classic square crop for cross-platform consistency.",
    aspect: "square",
    zoom: 1.08,
    recommendedFor: ["instagram", "linkedin", "twitter"],
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to render the edited image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

async function loadImageFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to load this image for editing.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;

    if (typeof image.decode === "function") {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Unable to decode this image."));
      });
    }

    return { image, sourceBlob: blob, sourceUrl: objectUrl };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function createRotatedCanvas(image: HTMLImageElement, rotation: number) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const swapDimensions = normalizedRotation === 90 || normalizedRotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swapDimensions ? image.naturalHeight : image.naturalWidth;
  canvas.height = swapDimensions ? image.naturalWidth : image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to initialize image editor.");
  }

  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((normalizedRotation * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  return canvas;
}

function getAspectRatio(aspect: CropAspect, width: number, height: number) {
  switch (aspect) {
    case "square":
      return 1;
    case "portrait":
      return 4 / 5;
    case "landscape":
      return 16 / 9;
    case "story":
      return 9 / 16;
    default:
      return width / height;
  }
}

function createEditedCanvas(
  image: HTMLImageElement,
  settings: RenderSettings,
  longestEdgeLimit: number,
) {
  const rotatedCanvas = createRotatedCanvas(image, settings.rotation);
  const sourceWidth = rotatedCanvas.width;
  const sourceHeight = rotatedCanvas.height;

  let cropWidth: number;
  let cropHeight: number;

  if (settings.aspect === "free") {
    // freeWidth/freeHeight are 0.3–1.0 fractions of the source dimensions
    // zoom is applied on top as a separate scale-in
    cropWidth = (sourceWidth * settings.freeWidth) / settings.zoom;
    cropHeight = (sourceHeight * settings.freeHeight) / settings.zoom;
    // clamp so crop can never exceed source
    cropWidth = clamp(cropWidth, 10, sourceWidth);
    cropHeight = clamp(cropHeight, 10, sourceHeight);
  } else {
    const aspectRatio = getAspectRatio(settings.aspect, sourceWidth, sourceHeight);
    let baseCropWidth = sourceWidth;
    let baseCropHeight = sourceHeight;

    if (sourceWidth / sourceHeight > aspectRatio) {
      baseCropWidth = sourceHeight * aspectRatio;
    } else {
      baseCropHeight = sourceWidth / aspectRatio;
    }

    cropWidth = baseCropWidth / settings.zoom;
    cropHeight = baseCropHeight / settings.zoom;
  }

  cropWidth = clamp(cropWidth, 1, sourceWidth);
  cropHeight = clamp(cropHeight, 1, sourceHeight);

  const maxOffsetX = Math.max((sourceWidth - cropWidth) / 2, 0);
  const maxOffsetY = Math.max((sourceHeight - cropHeight) / 2, 0);
  const centerX = sourceWidth / 2 + settings.panX * maxOffsetX;
  const centerY = sourceHeight / 2 + settings.panY * maxOffsetY;

  const sourceX = clamp(centerX - cropWidth / 2, 0, sourceWidth - cropWidth);
  const sourceY = clamp(centerY - cropHeight / 2, 0, sourceHeight - cropHeight);

  const scale = Math.min(1, longestEdgeLimit / Math.max(cropWidth, cropHeight));
  const outputWidth = Math.max(1, Math.round(cropWidth * scale));
  const outputHeight = Math.max(1, Math.round(cropHeight * scale));

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;

  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) {
    throw new Error("Unable to render the edited image.");
  }

  outputContext.drawImage(
    rotatedCanvas,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return outputCanvas;
}

function getOutputMimeType(asset: MediaAsset, sourceBlob: Blob | null) {
  if (asset.mime_type === "image/png" || sourceBlob?.type === "image/png") {
    return "image/png";
  }
  return "image/jpeg";
}

function getOutputFileName(asset: MediaAsset, mimeType: string) {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return `edited-media-${asset.id}.${extension}`;
}

export function MediaEditModal({
  asset,
  open,
  saving,
  selectedPlatforms,
  onClose,
  onSave,
}: Props) {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceBlob, setSourceBlob] = useState<Blob | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null);
  const [altText, setAltText] = useState("");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [freeWidth, setFreeWidth] = useState(1);
  const [freeHeight, setFreeHeight] = useState(1);
  const [aspect, setAspect] = useState<CropAspect>("original");
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [renderingPreview, setRenderingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniquePlatforms = useMemo(
    () => Array.from(new Set(selectedPlatforms)),
    [selectedPlatforms],
  );

  const recommendedPresets = useMemo(() => {
    if (uniquePlatforms.length === 0) {
      return QUICK_PRESETS;
    }

    const matched = QUICK_PRESETS.filter((preset) =>
      preset.recommendedFor?.some((platform) => uniquePlatforms.includes(platform)),
    );

    return matched.length > 0 ? matched : QUICK_PRESETS;
  }, [uniquePlatforms]);

  const imageSummary = useMemo(() => {
    if (!asset) return null;

    const parts = [
      asset.width_px && asset.height_px ? `${asset.width_px} x ${asset.height_px}` : null,
      formatBytes(asset.file_size_bytes),
      asset.mime_type?.replace("image/", "").toUpperCase() ?? null,
    ].filter(Boolean);

    return parts.join(" | ");
  }, [asset]);

  function markEditedMode() {
    setCompareOriginal(false);
    setError(null);
  }

  function resetFreeCrop() {
    setFreeWidth(1);
    setFreeHeight(1);
  }

  useEffect(() => {
    if (!open || !asset) {
      return;
    }

    let cancelled = false;
    setSourceImage(null);
    setSourceBlob(null);
    setPreviewMeta(null);
    setCompareOriginal(false);
    setActivePresetId(null);
    setPreviewUrl((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setLoading(true);
    setError(null);
    setAltText(asset.alt_text ?? "");
    setRotation(0);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setFreeWidth(1);
    setFreeHeight(1);
    setAspect("original");

    loadImageFromUrl(asset.file_url)
      .then(({ image, sourceBlob: blob, sourceUrl: objectUrl }) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setSourceImage(image);
        setSourceBlob(blob);
        setSourceUrl(objectUrl);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to open this image.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [asset, open]);

  useEffect(() => {
    return () => {
      if (sourceUrl) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!open || !asset || !sourceImage) {
      return;
    }

    let cancelled = false;
    let nextPreviewUrl: string | null = null;
    const mimeType = getOutputMimeType(asset, sourceBlob);

    setRenderingPreview(true);

    const run = async () => {
      try {
        const canvas = createEditedCanvas(
          sourceImage,
          { rotation, zoom, panX, panY, aspect, freeWidth, freeHeight },
          900,
        );
        const blob = await canvasToBlob(
          canvas,
          mimeType,
          mimeType === "image/jpeg" ? 0.9 : undefined,
        );
        nextPreviewUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setPreviewMeta({
            width: canvas.width,
            height: canvas.height,
            mimeType,
          });
          setPreviewUrl((current) => {
            if (current) {
              URL.revokeObjectURL(current);
            }
            return nextPreviewUrl;
          });
        }
      } catch (previewError) {
        if (!cancelled) {
          setError(previewError instanceof Error ? previewError.message : "Unable to render preview.");
        }
        if (nextPreviewUrl) {
          URL.revokeObjectURL(nextPreviewUrl);
        }
      } finally {
        if (!cancelled) {
          setRenderingPreview(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (nextPreviewUrl) {
        URL.revokeObjectURL(nextPreviewUrl);
      }
    };
  }, [open, asset, sourceBlob, sourceImage, rotation, zoom, panX, panY, aspect, freeWidth, freeHeight]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const canSave = Boolean(asset && sourceImage && !loading && !renderingPreview && !error);

  function applyPreset(preset: Preset) {
    markEditedMode();
    setAspect(preset.aspect);
    setZoom(preset.zoom ?? 1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    resetFreeCrop();
    setActivePresetId(preset.id);
  }

  function applyAspect(nextAspect: CropAspect) {
    markEditedMode();
    setAspect(nextAspect);
    setActivePresetId(null);
    if (nextAspect !== "free") {
      resetFreeCrop();
    }
  }

  function resetAdjustments() {
    setAspect("original");
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    resetFreeCrop();
    setActivePresetId(null);
    setCompareOriginal(false);
    setError(null);
  }

  function nudge(axis: "x" | "y", delta: number) {
    markEditedMode();
    if (axis === "x") {
      setPanX((current) => clamp(current + delta, -1, 1));
      return;
    }
    setPanY((current) => clamp(current + delta, -1, 1));
  }

  function rotate(delta: number) {
    markEditedMode();
    setRotation((current) => (current + delta + 360) % 360);
    setActivePresetId(null);
  }

  async function handleSave() {
    if (!asset || !sourceImage) {
      return;
    }

    const mimeType = getOutputMimeType(asset, sourceBlob);
    const canvas = createEditedCanvas(
      sourceImage,
      { rotation, zoom, panX, panY, aspect, freeWidth, freeHeight },
      1600,
    );
    const blob = await canvasToBlob(canvas, mimeType, mimeType === "image/jpeg" ? 0.92 : undefined);

    await onSave({
      blob,
      altText: altText.trim(),
      fileName: getOutputFileName(asset, mimeType),
      mimeType,
    });
  }

  return (
    <AnimatePresence>
      {open && asset ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(8,10,18,0.68)] p-2 backdrop-blur-md sm:p-3"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            style={{ height: "min(90vh, 800px)" }}
            className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#d8ccb5] bg-[#f8f2e8] shadow-[0_28px_90px_rgba(15,20,30,0.25)] sm:rounded-[28px]"
          >
            {/* ── Header ── */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#eadfcb] bg-[linear-gradient(135deg,#fff7e8_0%,#f6eddc_100%)] px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9b7b3f]">
                  Media Polish Studio
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-[#111827] sm:text-lg">
                  Shape this image like a publish-ready social asset
                </h2>
                {imageSummary && (
                  <p className="mt-0.5 text-xs font-medium text-[#8b7354]">{imageSummary}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="shrink-0 rounded-full border border-[#e6dccb] bg-white/80 px-4 py-1.5 text-sm font-semibold text-[#5f6675] transition-colors hover:bg-white hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close media editor"
              >
                Close
              </button>
            </div>

            {/* ── Body: two columns on lg, stacked + scrollable on mobile ── */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">

              {/* LEFT — preview (fixed height on mobile, fills height on desktop) */}
              <div className="flex h-[42vh] shrink-0 flex-col border-b border-[#eadfcb] bg-[radial-gradient(circle_at_top,_rgba(255,213,42,0.16),_transparent_46%),linear-gradient(180deg,#fffaf2_0%,#f1e7d6_100%)] lg:h-auto lg:min-h-0 lg:flex-1 lg:border-b-0 lg:border-r">
                {/* preview toolbar */}
                <div className="shrink-0 px-4 py-2 sm:px-5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9b7b3f]">
                        Live Preview
                      </div>
                      <p className="text-xs text-[#6b7280]">
                        {compareOriginal ? "Original upload." : "Edited output."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCompareOriginal((current) => !current)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                          compareOriginal
                            ? "border-[#c58f38] bg-[#ffd86a] text-[#4d3300]"
                            : "border-[#e0d5c2] bg-white/80 text-[#5f6675] hover:border-[#c58f38] hover:text-[#1f2937]"
                        }`}
                      >
                        {compareOriginal ? "Back to edited" : "Compare original"}
                      </button>
                      <button
                        type="button"
                        onClick={resetAdjustments}
                        className="rounded-full border border-[#e0d5c2] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#5f6675] transition-colors hover:border-[#c58f38] hover:text-[#1f2937]"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {uniquePlatforms.slice(0, 4).map((platform) => (
                      <span
                        key={platform}
                        className="rounded-full bg-[rgba(17,24,39,0.72)] px-2.5 py-1 text-[10px] font-semibold text-white"
                      >
                        {PLATFORM_LABELS[platform]}
                      </span>
                    ))}
                    {previewMeta && !compareOriginal && (
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#5f6675]">
                        Output {previewMeta.width} x {previewMeta.height}
                      </span>
                    )}
                  </div>
                </div>

                {/* image preview area — fills remaining height */}
                <div className="min-h-0 flex-1 px-4 pb-3 sm:px-5">
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border border-white/70 bg-[linear-gradient(180deg,#f7ecdb_0%,#f4e7d5_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                    {loading ? (
                      <div className="text-sm text-[#7c6f57]">Loading image editor...</div>
                    ) : error ? (
                      <div className="mx-auto max-w-sm rounded-2xl border border-[#f2c7c1] bg-[#fff3f1] px-4 py-3 text-sm text-[#9b4c43]">
                        {error}
                      </div>
                    ) : (
                      <>
                        {(compareOriginal ? asset.file_url : previewUrl) ? (
                          <img
                            src={compareOriginal ? asset.file_url : previewUrl ?? asset.file_url}
                            alt={altText || asset.alt_text || "Edited preview"}
                            className="max-h-full max-w-full object-contain"
                            style={{ display: "block" }}
                          />
                        ) : (
                          <div className="text-sm text-[#7c6f57]">Preparing preview...</div>
                        )}
                        <div className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-white/55 shadow-[0_0_0_999px_rgba(17,24,39,0.06)]" />
                        {renderingPreview && !compareOriginal && (
                          <div className="absolute inset-x-3 bottom-3 rounded-full bg-[#111827]/72 px-3 py-1.5 text-center text-xs font-medium text-white">
                            Refreshing preview...
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT — controls panel, independently scrollable */}
              <div className="flex w-full shrink-0 flex-col overflow-hidden bg-[#fbf7ef] lg:w-[360px] xl:w-[400px]">
                <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
                  <div className="space-y-5">
                    <section className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-[#1f2937]">Quick social presets</h3>
                          <p className="mt-1 text-xs text-[#6b7280]">
                            Start with a platform-friendly framing, then fine-tune the details.
                          </p>
                        </div>
                        {uniquePlatforms.length > 0 && (
                          <span className="rounded-full bg-[#fff2c2] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d5c0f]">
                            Tuned for selected channels
                          </span>
                        )}
                      </div>

                      <div className="grid gap-2">
                        {recommendedPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                              activePresetId === preset.id
                                ? "border-[#d4a94f] bg-[#fff1bf]"
                                : "border-[#e7dece] bg-white hover:border-[#d4a94f]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-[#1f2937]">{preset.label}</span>
                              <span className="rounded-full bg-[#f8f2e8] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8b7354]">
                                {preset.aspect}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-[#6b7280]">{preset.description}</p>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1f2937]">Aspect and crop</h3>
                        <p className="mt-1 text-xs text-[#6b7280]">
                          Switch between fixed ratios or choose free crop for full manual control.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {ASPECT_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => applyAspect(option.id)}
                            className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                              aspect === option.id
                                ? "border-[#d4a94f] bg-[#fff2c2] text-[#7d5c0f]"
                                : "border-[#e7dece] bg-white text-[#4b5563] hover:border-[#d4a94f] hover:text-[#1f2937]"
                            }`}
                          >
                            <div className="text-sm font-semibold">{option.label}</div>
                            <div className="mt-1 text-[11px] leading-4 opacity-80">{option.hint}</div>
                          </button>
                        ))}
                      </div>

                      {aspect === "free" && (
                        <div className="rounded-2xl border border-[#eadfcb] bg-white px-4 py-4">
                          <div className="mb-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-[#9b7b3f]">
                              Free Crop Size
                            </div>
                            <p className="mt-1 text-xs text-[#6b7280]">
                              Narrow the crop width and height independently.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <label className="block">
                              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#4b5563]">
                                <span>Crop width</span>
                                <span>{Math.round(freeWidth * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.01"
                                value={freeWidth}
                                onChange={(event) => {
                                  markEditedMode();
                                  setFreeWidth(Number(event.target.value));
                                  setActivePresetId(null);
                                }}
                                className="w-full accent-[#d4a94f]"
                              />
                            </label>

                            <label className="block">
                              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#4b5563]">
                                <span>Crop height</span>
                                <span>{Math.round(freeHeight * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.3"
                                max="1"
                                step="0.01"
                                value={freeHeight}
                                onChange={(event) => {
                                  markEditedMode();
                                  setFreeHeight(Number(event.target.value));
                                  setActivePresetId(null);
                                }}
                                className="w-full accent-[#d4a94f]"
                              />
                            </label>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1f2937]">Framing controls</h3>
                        <p className="mt-1 text-xs text-[#6b7280]">
                          Any adjustment automatically switches back to the edited preview so changes stay visible.
                        </p>
                      </div>

                      <label className="block">
                        <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#4b5563]">
                          <span>Zoom</span>
                          <span>{zoom.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="3"
                          step="0.05"
                          value={zoom}
                          onChange={(event) => {
                            markEditedMode();
                            setZoom(Number(event.target.value));
                            setActivePresetId(null);
                          }}
                          className="w-full accent-[#d4a94f]"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#eadfcb] bg-white px-4 py-3">
                          <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#4b5563]">
                            <span>Horizontal</span>
                            <span>{Math.round(panX * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.01"
                            value={panX}
                            onChange={(event) => {
                              markEditedMode();
                              setPanX(Number(event.target.value));
                              setActivePresetId(null);
                            }}
                            className="w-full accent-[#d4a94f]"
                          />
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => nudge("x", -0.08)}
                              className="flex-1 rounded-full border border-[#e7dece] px-3 py-2 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#d4a94f] hover:text-[#1f2937]"
                            >
                              Left
                            </button>
                            <button
                              type="button"
                              onClick={() => nudge("x", 0.08)}
                              className="flex-1 rounded-full border border-[#e7dece] px-3 py-2 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#d4a94f] hover:text-[#1f2937]"
                            >
                              Right
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#eadfcb] bg-white px-4 py-3">
                          <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#4b5563]">
                            <span>Vertical</span>
                            <span>{Math.round(panY * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.01"
                            value={panY}
                            onChange={(event) => {
                              markEditedMode();
                              setPanY(Number(event.target.value));
                              setActivePresetId(null);
                            }}
                            className="w-full accent-[#d4a94f]"
                          />
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => nudge("y", -0.08)}
                              className="flex-1 rounded-full border border-[#e7dece] px-3 py-2 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#d4a94f] hover:text-[#1f2937]"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => nudge("y", 0.08)}
                              className="flex-1 rounded-full border border-[#e7dece] px-3 py-2 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#d4a94f] hover:text-[#1f2937]"
                            >
                              Down
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#eadfcb] bg-white px-4 py-4">
                        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-[#9b7b3f]">
                              Rotation
                            </div>
                            <div className="mt-1 text-sm text-[#374151]">{rotation} deg</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => rotate(-90)}
                              className="rounded-full border border-[#e7dece] px-3 py-2 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#d4a94f] hover:text-[#1f2937]"
                            >
                              Rotate left
                            </button>
                            <button
                              type="button"
                              onClick={() => rotate(90)}
                              className="rounded-full border border-[#e7dece] px-3 py-2 text-xs font-semibold text-[#4b5563] transition-colors hover:border-[#d4a94f] hover:text-[#1f2937]"
                            >
                              Rotate right
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-[#1f2937]">Accessibility and export</h3>
                        <p className="mt-1 text-xs text-[#6b7280]">
                          Keep the edited copy descriptive and ready for platforms that support alt text.
                        </p>
                      </div>

                      <textarea
                        value={altText}
                        onChange={(event) => setAltText(event.target.value)}
                        placeholder="Describe the final image for screen readers"
                        className="min-h-[104px] w-full rounded-2xl border border-[#e7dece] bg-white px-4 py-3 text-sm text-[#111827] outline-none transition-all focus:border-[#d4a94f] focus:ring-2 focus:ring-[#d4a94f]/25"
                      />

                      {previewMeta && (
                        <div className="rounded-2xl border border-[#eadfcb] bg-white px-4 py-3 text-xs text-[#6b7280]">
                          Export preview: {previewMeta.width} x {previewMeta.height} in{" "}
                          {previewMeta.mimeType === "image/png" ? "PNG" : "JPEG"} format.
                        </div>
                      )}
                    </section>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#eadfcb] bg-white/80 px-4 py-3 sm:px-5">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={saving}
                      className="rounded-full border border-[#d9cfbf] px-5 py-2 text-sm font-semibold text-[#4b5563] transition-colors hover:border-[#bca47a] hover:text-[#1f2937] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      disabled={!canSave || saving}
                      className="rounded-full bg-[#ffd52a] px-6 py-2 text-sm font-bold text-[#09090e] shadow-[0_8px_26px_rgba(255,213,42,0.28)] transition-colors hover:bg-[#ffe566] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? "Saving edited copy..." : "Save edited copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
