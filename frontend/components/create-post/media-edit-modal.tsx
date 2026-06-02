"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

type FreeCropBox = {
  x: number; 
  y: number; 
  w: number; 
  h: number; 
};

type Preset = {
  id: string;
  label: string;
  description: string;
  aspect: CropAspect;
  recommendedFor?: PlatformName[];
};

const ASPECT_OPTIONS: { id: CropAspect; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "original", label: "Original" },
  { id: "square", label: "1:1" },
  { id: "portrait", label: "4:5" },
  { id: "landscape", label: "16:9" },
  { id: "story", label: "9:16" },
];

const QUICK_PRESETS: Preset[] = [
  {
    id: "feed",
    label: "Instagram Feed",
    description: "Best for Instagram & FB posts.",
    aspect: "portrait",
    recommendedFor: ["instagram", "facebook"],
  },
  {
    id: "story",
    label: "Story / Reel",
    description: "Vertical mobile framing.",
    aspect: "story",
    recommendedFor: ["instagram", "facebook", "youtube"],
  },
  {
    id: "youtube",
    label: "YouTube Wide",
    description: "Standard 16:9 cinematic.",
    aspect: "landscape",
    recommendedFor: ["youtube"],
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

async function loadImageFromUrl(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.src = objectUrl;
  await new Promise((res) => (image.onload = res));
  return { image, sourceUrl: objectUrl };
}

function createEditedCanvas(image: HTMLImageElement, settings: RenderSettings, limit: number) {
  const norm = ((settings.rotation % 360) + 360) % 360;
  const swap = norm === 90 || norm === 270;
  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = swap ? image.naturalHeight : image.naturalWidth;
  rotCanvas.height = swap ? image.naturalWidth : image.naturalHeight;
  const ctx = rotCanvas.getContext("2d")!;
  ctx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
  ctx.rotate((norm * Math.PI) / 180);
  ctx.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const sW = rotCanvas.width;
  const sH = rotCanvas.height;
  let cW: number, cH: number, sX: number, sY: number;

  if (settings.aspect === "free") {
    cW = clamp(settings.freeCropBox.w * sW, 10, sW);
    cH = clamp(settings.freeCropBox.h * sH, 10, sH);
    sX = clamp(settings.freeCropBox.x * sW, 0, sW - cW);
    sY = clamp(settings.freeCropBox.y * sH, 0, sH - cH);
  } else {
    const ratios = { square: 1, portrait: 0.8, landscape: 1.777, story: 0.5625, original: sW / sH, free: 1 };
    const ratio = ratios[settings.aspect] || sW / sH;
    let bW = sW, bH = sH;
    if (sW / sH > ratio) bW = sH * ratio; else bH = sW / ratio;
    cW = bW / settings.zoom;
    cH = bH / settings.zoom;
    sX = clamp(sW / 2 + settings.panX * ((sW - cW) / 2) - cW / 2, 0, sW - cW);
    sY = clamp(sH / 2 + settings.panY * ((sH - cH) / 2) - cH / 2, 0, sH - cH);
  }

  const scale = Math.min(1, limit / Math.max(cW, cH));
  const out = document.createElement("canvas");
  out.width = cW * scale; out.height = cH * scale;
  out.getContext("2d")!.drawImage(rotCanvas, sX, sY, cW, cH, 0, 0, out.width, out.height);
  return out;
}

export function MediaEditModal({ asset, open, saving, selectedPlatforms, onClose, onSave }: Props) {
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState("");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [aspect, setAspect] = useState<CropAspect>("original");
  const [freeCropBox, setFreeCropBox] = useState<FreeCropBox>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync ref for dragging logic to avoid closure staleness
  const freeBoxRef = useRef(freeCropBox);
  useEffect(() => { freeBoxRef.current = freeCropBox; }, [freeCropBox]);

  const imgRef = useRef<HTMLImageElement>(null);
  const getImgRect = useCallback(() => imgRef.current?.getBoundingClientRect() ?? null, []);
  
  const clientToImg = useCallback((cX: number, cY: number, r: DOMRect) => ({
    x: clamp((cX - r.left) / r.width, 0, 1),
    y: clamp((cY - r.top) / r.height, 0, 1),
  }), []);

  const startInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    if (aspect !== "free" || compareOriginal) return;
    const r = getImgRect(); if (!r) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const startPos = clientToImg(clientX, clientY, r);
    const initialBox = { ...freeBoxRef.current };
    
    // Determine drag mode
    const H = 0.05; // Handle sensitivity
    let mode = "new";
    const { x, y, w, h } = initialBox;
    const inBox = startPos.x >= x && startPos.x <= x + w && startPos.y >= y && startPos.y <= y + h;
    
    if (inBox) mode = "move";
    if (Math.abs(startPos.y - y) < H) mode = "n";
    else if (Math.abs(startPos.y - (y + h)) < H) mode = "s";
    if (Math.abs(startPos.x - x) < H) mode = (mode === "move" || mode === "new") ? "w" : mode + "w";
    else if (Math.abs(startPos.x - (x + w)) < H) mode = (mode === "move" || mode === "new") ? "e" : mode + "e";

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const mX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const mY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const cur = clientToImg(mX, mY, r);
      const dx = cur.x - startPos.x;
      const dy = cur.y - startPos.y;

      setFreeCropBox(() => {
        if (mode === "move") return { ...initialBox, x: clamp(initialBox.x + dx, 0, 1 - initialBox.w), y: clamp(initialBox.y + dy, 0, 1 - initialBox.h) };
        if (mode === "new") return { x: Math.min(startPos.x, cur.x), y: Math.min(startPos.y, cur.y), w: clamp(Math.abs(cur.x - startPos.x), 0.05, 1), h: clamp(Math.abs(cur.y - startPos.y), 0.05, 1) };
        
        let nb = { ...initialBox };
        if (mode.includes("n")) { const ny = clamp(initialBox.y + dy, 0, initialBox.y + initialBox.h - 0.05); nb.y = ny; nb.h = initialBox.y + initialBox.h - ny; }
        if (mode.includes("s")) nb.h = clamp(initialBox.h + dy, 0.05, 1 - initialBox.y);
        if (mode.includes("w")) { const nx = clamp(initialBox.x + dx, 0, initialBox.x + initialBox.w - 0.05); nb.x = nx; nb.w = initialBox.x + initialBox.w - nx; }
        if (mode.includes("e")) nb.w = clamp(initialBox.w + dx, 0.05, 1 - initialBox.x);
        return nb;
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
  };

  useEffect(() => {
    if (!open || !asset) return;
    setLoading(true);
    loadImageFromUrl(asset.file_url).then(res => {
      setSourceImage(res.image); setSourceUrl(res.sourceUrl);
      setAltText(asset.alt_text ?? ""); setLoading(false);
    });
  }, [asset, open]);

  useEffect(() => {
    if (!open || !sourceImage) return;
    const canvas = createEditedCanvas(sourceImage, { rotation, zoom, panX, panY, aspect, freeWidth: 1, freeHeight: 1, freeCropBox }, 900);
    const mime = asset?.mime_type || "image/jpeg";
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      }
    }, mime, 0.9);
  }, [rotation, zoom, panX, panY, aspect, freeCropBox, sourceImage, open, asset?.mime_type]);

  const isFreeCrop = aspect === "free" && !compareOriginal;

  return (
    <AnimatePresence>
      {open && asset && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-stretch justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4">
          <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} className="flex h-[100dvh] w-full max-w-7xl flex-col overflow-hidden bg-[#f8f2e8] shadow-2xl sm:h-[95dvh] sm:rounded-[24px] sm:border sm:border-[#d8ccb5]">
            
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#eadfcb] bg-white/70 px-3 py-3 sm:px-6 sm:py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-gray-900 sm:text-lg">Media Polish Studio</h2>
                <p className="text-xs font-semibold text-amber-800">{asset.width_px}x{asset.height_px} | {formatBytes(asset.file_size_bytes)}</p>
              </div>
              <button onClick={onClose} className="shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50 sm:px-6 sm:text-sm">Close</button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
              <div className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-[#f1e7d6] p-2 sm:p-4 lg:h-auto lg:min-h-0 lg:flex-1 lg:shrink lg:p-6 ${isFreeCrop ? "h-[48dvh] min-h-[300px] sm:h-[64dvh] sm:min-h-[380px]" : "h-[34dvh] min-h-[210px] sm:h-[48dvh] sm:min-h-[260px]"}`}>
                <div className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden" onMouseDown={startInteraction} onTouchStart={startInteraction}>
                  {previewUrl ? (
                    <img
                      ref={imgRef}
                      src={compareOriginal ? asset.file_url : previewUrl}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                      alt="Preview"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-[#d8ccb5] bg-white/35 text-xs font-semibold text-[#8b7b62]">
                      {loading ? "Preparing preview..." : "Preview unavailable"}
                    </div>
                  )}
                  {isFreeCrop && (
                    <div className="absolute border-2 border-yellow-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] "
                      style={{ left: `${freeCropBox.x * 100}%`, top: `${freeCropBox.y * 100}%`, width: `${freeCropBox.w * 100}%`, height: `${freeCropBox.h * 100}%` }}>
                      <div className="grid h-full w-full grid-cols-3 grid-rows-3 opacity-20"><div className="border border-white col-span-3 row-span-3" /></div>
                      <div className="absolute -left-2 -top-2 h-5 w-5 bg-yellow-400 rounded-full border-2 border-white" />
                      <div className="absolute -right-2 -top-2 h-5 w-5 bg-yellow-400 rounded-full border-2 border-white" />
                      <div className="absolute -left-2 -bottom-2 h-5 w-5 bg-yellow-400 rounded-full border-2 border-white" />
                      <div className="absolute -right-2 -bottom-2 h-5 w-5 bg-yellow-400 rounded-full border-2 border-white" />
                    </div>
                  )}
                  {isFreeCrop && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white">
                      Drag crop area or corners
                    </div>
                  )}
                </div>
              </div>

              <div className="min-h-0 w-full flex-1 space-y-4 overflow-y-auto border-t border-[#eadfcb] bg-white p-3 pb-0 sm:space-y-6 sm:p-4 sm:pb-0 lg:w-[380px] lg:flex-none lg:space-y-8 lg:border-l lg:border-t-0 lg:p-6 lg:pb-0">
                {!isFreeCrop && <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Recommended</label>
                  <div className="mt-2 grid grid-cols-1 gap-1.5 sm:mt-3 sm:grid-cols-3 sm:gap-2 lg:grid-cols-1">
                    {QUICK_PRESETS.map((p) => (
                      <button key={p.id} onClick={() => setAspect(p.aspect)}
                        className={`w-full rounded-xl border-2 p-2 text-left transition-all sm:rounded-2xl sm:p-3 lg:p-4 ${aspect === p.aspect ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900 sm:text-sm">{p.label}</span>
                          {p.recommendedFor?.some(r => selectedPlatforms.includes(r)) && <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700 sm:px-2 sm:text-[10px]">MATCH</span>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-500 sm:mt-1 sm:text-xs">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </section>}

                <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Aspects</label>
                  <div className="mt-2 grid grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2">
                    {ASPECT_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setAspect(opt.id)}
                        className={`rounded-lg border px-1.5 py-1.5 text-[11px] font-bold transition-all sm:rounded-xl sm:py-2.5 sm:text-xs ${aspect === opt.id ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Tools</label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex-1 py-3 text-xs font-bold border rounded-xl hover:bg-gray-50 transition-all">Rotate 90°</button>
                    <button onMouseDown={() => setCompareOriginal(true)} onMouseUp={() => setCompareOriginal(false)} onMouseLeave={() => setCompareOriginal(false)} onTouchStart={() => setCompareOriginal(true)} onTouchEnd={() => setCompareOriginal(false)} className="flex-1 py-3 text-xs font-bold border rounded-xl hover:bg-gray-50">Compare</button>
                  </div>
                </section>

                <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Alt Text</label>
                  <textarea value={altText} onChange={e => setAltText(e.target.value)}
                    className="mt-2 min-h-[72px] w-full rounded-2xl border border-gray-100 bg-gray-50 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 sm:min-h-[100px] sm:p-4"
                    placeholder="Describe for accessibility..." />
                </section>

                <div className="sticky bottom-0 -mx-3 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_24px_rgba(255,255,255,0.92)] backdrop-blur sm:-mx-4 sm:px-4 sm:pb-4 lg:-mx-6 lg:px-6">
                  <button disabled={saving || loading} onClick={() => {
                    const canvas = createEditedCanvas(sourceImage!, { rotation, zoom, panX, panY, aspect, freeWidth: 1, freeHeight: 1, freeCropBox }, 1600);
                    canvas.toBlob(b => onSave({ blob: b!, altText, fileName: 'edit.jpg', mimeType: 'image/jpeg' }), 'image/jpeg', 0.92);
                  }}
                    className="w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-white shadow-xl shadow-amber-100 transition-all hover:bg-amber-600 active:scale-[0.97] disabled:opacity-30 sm:rounded-2xl sm:py-4">
                    {saving ? "Saving..." : "Apply All Changes"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
