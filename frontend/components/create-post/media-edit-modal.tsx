"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  freeCropBox: FreeCropBox;
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

type FreeCropBox = {
  x: number; 
  y: number; 
  w: number; 
  h: number; 
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
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to render the edited image."));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

async function loadImageFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load this image.");
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise((res, rej) => {
      image.onload = res;
      image.onerror = () => rej(new Error("Decode failed"));
    });
    return { image, sourceBlob: blob, sourceUrl: objectUrl };
  } catch (e) {
    URL.revokeObjectURL(objectUrl);
    throw e;
  }
}

function createRotatedCanvas(image: HTMLImageElement, rotation: number) {
  const norm = ((rotation % 360) + 360) % 360;
  const swap = norm === 90 || norm === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swap ? image.naturalHeight : image.naturalWidth;
  canvas.height = swap ? image.naturalWidth : image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Context failed");
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((norm * Math.PI) / 180);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  return canvas;
}

function getAspectRatio(aspect: CropAspect, width: number, height: number) {
  switch (aspect) {
    case "square": return 1;
    case "portrait": return 4 / 5;
    case "landscape": return 16 / 9;
    case "story": return 9 / 16;
    default: return width / height;
  }
}

function createEditedCanvas(image: HTMLImageElement, settings: RenderSettings, limit: number) {
  const rotated = createRotatedCanvas(image, settings.rotation);
  const sW = rotated.width;
  const sH = rotated.height;

  let cW: number, cH: number, sX: number, sY: number;

  if (settings.aspect === "free") {
    cW = clamp(settings.freeCropBox.w * sW, 10, sW);
    cH = clamp(settings.freeCropBox.h * sH, 10, sH);
    sX = clamp(settings.freeCropBox.x * sW, 0, sW - cW);
    sY = clamp(settings.freeCropBox.y * sH, 0, sH - cH);
  } else {
    const ratio = getAspectRatio(settings.aspect, sW, sH);
    let bW = sW, bH = sH;
    if (sW / sH > ratio) bW = sH * ratio; else bH = sW / ratio;
    cW = bW / settings.zoom;
    cH = bH / settings.zoom;
    const maxOX = Math.max((sW - cW) / 2, 0);
    const maxOY = Math.max((sH - cH) / 2, 0);
    sX = clamp(sW / 2 + settings.panX * maxOX - cW / 2, 0, sW - cW);
    sY = clamp(sH / 2 + settings.panY * maxOY - cH / 2, 0, sH - cH);
  }

  const scale = Math.min(1, limit / Math.max(cW, cH));
  const outW = Math.max(1, Math.round(cW * scale));
  const outH = Math.max(1, Math.round(cH * scale));

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext("2d");
  if (!outCtx) throw new Error("Render failed");
  outCtx.drawImage(rotated, sX, sY, cW, cH, 0, 0, outW, outH);
  return out;
}

export function MediaEditModal({ asset, open, saving, selectedPlatforms, onClose, onSave }: Props) {
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
  const [aspect, setAspect] = useState<CropAspect>("original");
  const [freeCropBox, setFreeCropBox] = useState<FreeCropBox>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  
  // CRITICAL: Ref to track box during drag sequences
  const freeBoxRef = useRef(freeCropBox);
  useEffect(() => { freeBoxRef.current = freeCropBox; }, [freeCropBox]);

  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [cropCursor, setCropCursor] = useState("crosshair");
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renderingPreview, setRenderingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  const getImgRect = useCallback(() => imgRef.current?.getBoundingClientRect() ?? null, []);

  const clientToImg = useCallback((clientX: number, clientY: number, imgRect: DOMRect) => ({
    x: clamp((clientX - imgRect.left) / imgRect.width, 0, 1),
    y: clamp((clientY - imgRect.top) / imgRect.height, 0, 1),
  }), []);

  const hitTest = (p: { x: number; y: number }, box: FreeCropBox) => {
    const H = 0.05; // Handle size sensitivity
    const { x, y, w, h } = box;
    const inBox = p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
    if (!inBox) return "new";
    if (p.x <= x + H && p.y <= y + H) return "nw";
    if (p.x >= x + w - H && p.y <= y + H) return "ne";
    if (p.x <= x + H && p.y >= y + h - H) return "sw";
    if (p.x >= x + w - H && p.y >= y + h - H) return "se";
    return "move";
  };

  const handleDrag = useCallback((clientX: number, clientY: number, startPos: { x: number, y: number }, initialBox: FreeCropBox, mode: string) => {
    const r = getImgRect();
    if (!r) return;
    const cur = clientToImg(clientX, clientY, r);
    const dx = cur.x - startPos.x;
    const dy = cur.y - startPos.y;

    setFreeCropBox(() => {
      const b = initialBox;
      if (mode === "new") {
        const nx = Math.min(startPos.x, cur.x);
        const ny = Math.min(startPos.y, cur.y);
        return {
          x: clamp(nx, 0, 1),
          y: clamp(ny, 0, 1),
          w: clamp(Math.abs(cur.x - startPos.x), 0.05, 1 - nx),
          h: clamp(Math.abs(cur.y - startPos.y), 0.05, 1 - ny),
        };
      }
      if (mode === "move") {
        return { ...b, x: clamp(b.x + dx, 0, 1 - b.w), y: clamp(b.y + dy, 0, 1 - b.h) };
      }
      
      let { x: bx, y: by, w: bw, h: bh } = b;
      let nb = { ...b };
      if (mode.includes("n")) { const ny = clamp(by + dy, 0, by + bh - 0.05); nb.y = ny; nb.h = by + bh - ny; }
      if (mode.includes("s")) { nb.h = clamp(bh + dy, 0.05, 1 - by); }
      if (mode.includes("w")) { const nx = clamp(bx + dx, 0, bx + bw - 0.05); nb.x = nx; nb.w = bx + bw - nx; }
      if (mode.includes("e")) { nb.w = clamp(bw + dx, 0.05, 1 - bx); }
      return nb;
    });
  }, [getImgRect, clientToImg]);

  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (aspect !== "free" || compareOriginal) return;
    const r = getImgRect();
    if (!r) return;
    e.preventDefault();
    const startPos = clientToImg(e.clientX, e.clientY, r);
    const initialBox = { ...freeBoxRef.current };
    const mode = hitTest(startPos, initialBox);
    setIsDraggingCrop(true);

    const onMove = (me: MouseEvent) => handleDrag(me.clientX, me.clientY, startPos, initialBox, mode);
    const onUp = () => {
      setIsDraggingCrop(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleCropTouchStart = (e: React.TouchEvent) => {
    if (aspect !== "free" || compareOriginal) return;
    const r = getImgRect();
    if (!r) return;
    const t = e.touches[0];
    const startPos = clientToImg(t.clientX, t.clientY, r);
    const initialBox = { ...freeBoxRef.current };
    const mode = hitTest(startPos, initialBox);
    setIsDraggingCrop(true);

    const onMove = (te: TouchEvent) => {
      const touch = te.touches[0];
      handleDrag(touch.clientX, touch.clientY, startPos, initialBox, mode);
    };
    const onEnd = () => {
      setIsDraggingCrop(false);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
  };

  // Asset Loading
  useEffect(() => {
    if (!open || !asset) return;
    setLoading(true);
    loadImageFromUrl(asset.file_url).then(({ image, sourceBlob, sourceUrl }) => {
      setSourceImage(image);
      setSourceBlob(sourceBlob);
      setSourceUrl(sourceUrl);
      setAltText(asset.alt_text ?? "");
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); };
  }, [asset, open]);

  // Preview Generation
  useEffect(() => {
    if (!open || !sourceImage) return;
    setRenderingPreview(true);
    const mime = asset?.mime_type === "image/png" ? "image/png" : "image/jpeg";
    const canvas = createEditedCanvas(sourceImage, { rotation, zoom, panX, panY, aspect, freeWidth: 1, freeHeight: 1, freeCropBox }, 900);
    canvasToBlob(canvas, mime, 0.9).then(blob => {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      setPreviewMeta({ width: canvas.width, height: canvas.height, mimeType: mime });
      setRenderingPreview(false);
    });
  }, [rotation, zoom, panX, panY, aspect, freeCropBox, sourceImage, open]);

  const uniquePlatforms = useMemo(() => Array.from(new Set(selectedPlatforms)), [selectedPlatforms]);
  const imageSummary = useMemo(() => asset ? `${asset.width_px}x${asset.height_px} | ${formatBytes(asset.file_size_bytes)}` : null, [asset]);

  async function handleSave() {
    if (!asset || !sourceImage) return;
    const mime = asset.mime_type === "image/png" ? "image/png" : "image/jpeg";
    const canvas = createEditedCanvas(sourceImage, { rotation, zoom, panX, panY, aspect, freeWidth: 1, freeHeight: 1, freeCropBox }, 1600);
    const blob = await canvasToBlob(canvas, mime, 0.92);
    await onSave({ blob, altText: altText.trim(), fileName: `edited-${asset.id}.${mime === "image/png" ? 'png' : 'jpg'}`, mimeType: mime });
  }

  return (
    <AnimatePresence>
      {open && asset && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#f8f2e8] border border-[#d8ccb5] shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#eadfcb] px-6 py-4 bg-white/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Media Polish Studio</h2>
                <p className="text-xs text-amber-800">{imageSummary}</p>
              </div>
              <button onClick={onClose} className="rounded-full bg-white px-4 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50">Close</button>
            </div>

            <div className="flex flex-1 overflow-hidden lg:flex-row flex-col">
              {/* Preview Area */}
              <div className="relative flex-1 bg-[#f1e7d6] flex items-center justify-center p-8 overflow-hidden">
                <div 
                  className="relative max-h-full max-w-full"
                  onMouseDown={handleCropMouseDown}
                  onTouchStart={handleCropTouchStart}
                  onMouseMove={(e) => {
                    if (aspect !== "free" || isDraggingCrop) return;
                    const r = getImgRect(); if (!r) return;
                    setCropCursor(hitTest(clientToImg(e.clientX, e.clientY, r), freeBoxRef.current) === "move" ? "move" : "crosshair");
                  }}
                  style={{ cursor: aspect === "free" ? cropCursor : "default" }}
                >
                  {previewUrl && (
                    <img 
                      ref={imgRef} 
                      src={compareOriginal ? asset.file_url : previewUrl} 
                      className="max-h-[60vh] object-contain shadow-lg select-none pointer-events-none" 
                      alt="Preview" 
                    />
                  )}
                  
                  {aspect === "free" && !compareOriginal && (
                    <div 
                      className="absolute border-2 border-yellow-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                      style={{ 
                        left: `${freeCropBox.x * 100}%`, 
                        top: `${freeCropBox.y * 100}%`, 
                        width: `${freeCropBox.w * 100}%`, 
                        height: `${freeCropBox.h * 100}%` 
                      }}
                    >
                      <div className="grid h-full w-full grid-cols-3 grid-rows-3 opacity-30">
                        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white" />)}
                      </div>
                      {/* Corner Handles Visuals */}
                      <div className="absolute -left-1 -top-1 h-3 w-3 bg-yellow-400" />
                      <div className="absolute -right-1 -top-1 h-3 w-3 bg-yellow-400" />
                      <div className="absolute -left-1 -bottom-1 h-3 w-3 bg-yellow-400" />
                      <div className="absolute -right-1 -bottom-1 h-3 w-3 bg-yellow-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Controls */}
              <div className="w-full lg:w-80 border-l border-[#eadfcb] bg-white p-6 overflow-y-auto space-y-6">
                <section>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Crop Presets</label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {ASPECT_OPTIONS.map(opt => (
                      <button 
                        key={opt.id} 
                        onClick={() => { setAspect(opt.id); setActivePresetId(null); }}
                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${aspect === opt.id ? 'bg-amber-100 border-amber-500 font-bold' : 'bg-gray-50 border-gray-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Quick Tools</label>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Rotate 90°</button>
                    <button onClick={() => setCompareOriginal(!compareOriginal)} className={`flex-1 py-2 border rounded-lg ${compareOriginal ? 'bg-blue-50 border-blue-500' : ''}`}>Compare</button>
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Alt Text</label>
                  <textarea 
                    value={altText} 
                    onChange={e => setAltText(e.target.value)}
                    className="mt-2 w-full p-3 text-sm border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Describe this image for accessibility..."
                    rows={3}
                  />
                </section>

                <button 
                  disabled={saving || loading || renderingPreview}
                  onClick={handleSave}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 transition-all"
                >
                  {saving ? "Saving..." : "Apply Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}