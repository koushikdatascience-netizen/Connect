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

type FreeCropBox = {
  x: number; 
  y: number; 
  w: number; 
  h: number; 
};

type PreviewMeta = {
  width: number;
  height: number;
  mimeType: string;
};

const ASPECT_OPTIONS: { id: CropAspect; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "original", label: "Original" },
  { id: "square", label: "1:1" },
  { id: "portrait", label: "4:5" },
  { id: "landscape", label: "16:9" },
  { id: "story", label: "9:16" },
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
        reject(new Error("Unable to render."));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

async function loadImageFromUrl(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.src = objectUrl;
  await new Promise((res) => (image.onload = res));
  return { image, sourceBlob: blob, sourceUrl: objectUrl };
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
    const ratio = settings.aspect === "square" ? 1 : settings.aspect === "portrait" ? 0.8 : settings.aspect === "landscape" ? 1.777 : settings.aspect === "story" ? 0.5625 : sW / sH;
    let bW = sW, bH = sH;
    if (sW / sH > ratio) bW = sH * ratio; else bH = sW / ratio;
    cW = bW / settings.zoom;
    cH = bH / settings.zoom;
    sX = clamp(sW / 2 + settings.panX * ((sW - cW) / 2) - cW / 2, 0, sW - cW);
    sY = clamp(sH / 2 + settings.panY * ((sH - cH) / 2) - cH / 2, 0, sH - cH);
  }

  const scale = Math.min(1, limit / Math.max(cW, cH));
  const outW = Math.max(1, Math.round(cW * scale));
  const outH = Math.max(1, Math.round(cH * scale));
  const out = document.createElement("canvas");
  out.width = outW; out.height = outH;
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
  const [altText, setAltText] = useState("");
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [aspect, setAspect] = useState<CropAspect>("original");
  const [freeCropBox, setFreeCropBox] = useState<FreeCropBox>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const freeBoxRef = useRef(freeCropBox);
  useEffect(() => { freeBoxRef.current = freeCropBox; }, [freeCropBox]);

  const imgRef = useRef<HTMLImageElement>(null);
  const getImgRect = useCallback(() => imgRef.current?.getBoundingClientRect() ?? null, []);
  const clientToImg = useCallback((cX: number, cY: number, r: DOMRect) => ({
    x: clamp((cX - r.left) / r.width, 0, 1),
    y: clamp((cY - r.top) / r.height, 0, 1),
  }), []);

  const handleDrag = (clientX: number, clientY: number, startPos: { x: number, y: number }, initialBox: FreeCropBox, mode: string) => {
    const r = getImgRect();
    if (!r) return;
    const cur = clientToImg(clientX, clientY, r);
    const dx = cur.x - startPos.x;
    const dy = cur.y - startPos.y;

    setFreeCropBox(() => {
      const b = initialBox;
      if (mode === "move") return { ...b, x: clamp(b.x + dx, 0, 1 - b.w), y: clamp(b.y + dy, 0, 1 - b.h) };
      if (mode === "new") return { x: Math.min(startPos.x, cur.x), y: Math.min(startPos.y, cur.y), w: clamp(Math.abs(cur.x - startPos.x), 0.05, 1), h: clamp(Math.abs(cur.y - startPos.y), 0.05, 1) };
      
      let nb = { ...b };
      if (mode.includes("n")) { const ny = clamp(b.y + dy, 0, b.y + b.h - 0.05); nb.y = ny; nb.h = b.y + b.h - ny; }
      if (mode.includes("s")) nb.h = clamp(b.h + dy, 0.05, 1 - b.y);
      if (mode.includes("w")) { const nx = clamp(b.x + dx, 0, b.x + b.w - 0.05); nb.x = nx; nb.w = b.x + b.w - nx; }
      if (mode.includes("e")) nb.w = clamp(b.w + dx, 0.05, 1 - b.x);
      return nb;
    });
  };

  const startInteraction = (clientX: number, clientY: number) => {
    if (aspect !== "free" || compareOriginal) return;
    const r = getImgRect(); if (!r) return;
    const startPos = clientToImg(clientX, clientY, r);
    const b = freeBoxRef.current;
    const isEdge = (p: number, edge: number) => Math.abs(p - edge) < 0.05;
    let mode = "new";
    if (startPos.x >= b.x && startPos.x <= b.x + b.w && startPos.y >= b.y && startPos.y <= b.y + b.h) mode = "move";
    if (isEdge(startPos.y, b.y)) mode = "n";
    if (isEdge(startPos.y, b.y + b.h)) mode = mode === "n" ? mode : "s";
    if (isEdge(startPos.x, b.x)) mode += "w";
    if (isEdge(startPos.x, b.x + b.w)) mode += "e";

    setIsDragging(true);
    const onMove = (e: MouseEvent) => handleDrag(e.clientX, e.clientY, startPos, { ...b }, mode);
    const onUp = () => { setIsDragging(false); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  useEffect(() => {
    if (!open || !asset) return;
    setLoading(true);
    loadImageFromUrl(asset.file_url).then(res => {
      setSourceImage(res.image); setSourceBlob(res.sourceBlob); setSourceUrl(res.sourceUrl);
      setAltText(asset.alt_text ?? ""); setLoading(false);
    });
  }, [asset, open]);

  useEffect(() => {
    if (!open || !sourceImage) return;
    const mime = asset?.mime_type === "image/png" ? "image/png" : "image/jpeg";
    const canvas = createEditedCanvas(sourceImage, { rotation, zoom, panX, panY, aspect, freeWidth: 1, freeHeight: 1, freeCropBox }, 900);
    canvasToBlob(canvas, mime, 0.9).then(blob => {
      const url = URL.createObjectURL(blob);
      setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    });
  }, [rotation, zoom, panX, panY, aspect, freeCropBox, sourceImage, open]);

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-2 sm:p-3 backdrop-blur-md">
          <motion.div initial={{ scale: 0.98, y: 10 }} animate={{ scale: 1, y: 0 }} className="flex h-[95vh] w-full max-w-7xl flex-col overflow-hidden rounded-[24px] bg-[#f8f2e8] border border-[#d8ccb5] shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-[#eadfcb] px-6 py-4 bg-white/60">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Media Polish Studio</h2>
                <p className="text-xs font-semibold text-amber-800">{asset.width_px}x{asset.height_px} | {formatBytes(asset.file_size_bytes)}</p>
              </div>
              <button onClick={onClose} className="rounded-full bg-white px-5 py-2 text-sm font-bold border border-gray-200 hover:shadow-sm">Close</button>
            </div>

            <div className="flex flex-1 overflow-hidden lg:flex-row flex-col">
              <div className="relative flex-1 bg-[#f1e7d6] flex items-center justify-center p-2 lg:p-4 overflow-hidden">
                <div className="relative max-h-full max-w-full" onMouseDown={(e) => startInteraction(e.clientX, e.clientY)}>
                  {previewUrl && (
                    <img ref={imgRef} src={compareOriginal ? asset.file_url : previewUrl} className="max-h-[75vh] object-contain shadow-2xl select-none pointer-events-none rounded-lg" alt="Preview" />
                  )}
                  {aspect === "free" && !compareOriginal && (
                    <div className="absolute border-2 border-yellow-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
                      style={{ left: `${freeCropBox.x * 100}%`, top: `${freeCropBox.y * 100}%`, width: `${freeCropBox.w * 100}%`, height: `${freeCropBox.h * 100}%` }}>
                      <div className="grid h-full w-full grid-cols-3 grid-rows-3 opacity-20">
                        {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white" />)}
                      </div>
                      <div className="absolute -left-1.5 -top-1.5 h-4 w-4 bg-yellow-400 rounded-sm" />
                      <div className="absolute -right-1.5 -top-1.5 h-4 w-4 bg-yellow-400 rounded-sm" />
                      <div className="absolute -left-1.5 -bottom-1.5 h-4 w-4 bg-yellow-400 rounded-sm" />
                      <div className="absolute -right-1.5 -bottom-1.5 h-4 w-4 bg-yellow-400 rounded-sm" />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-85 border-l border-[#eadfcb] bg-white p-6 overflow-y-auto space-y-6">
                <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Crop Presets</label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {ASPECT_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setAspect(opt.id)}
                        className={`px-3 py-2.5 text-xs font-bold rounded-xl border transition-all ${aspect === opt.id ? 'bg-amber-100 border-amber-500 text-amber-900' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300'}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Quick Tools</label>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex-1 py-2.5 text-xs font-bold border rounded-xl hover:bg-gray-50 transition-all">Rotate 90°</button>
                    <button onClick={() => setCompareOriginal(!compareOriginal)} className={`flex-1 py-2.5 text-xs font-bold border rounded-xl transition-all ${compareOriginal ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>Compare</button>
                  </div>
                </section>

                <section>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Alt Text</label>
                  <textarea value={altText} onChange={e => setAltText(e.target.value)}
                    className="mt-2 w-full p-4 text-sm border-gray-100 border rounded-2xl focus:ring-2 focus:ring-amber-500 bg-gray-50 outline-none transition-all"
                    placeholder="Describe this image..." rows={3} />
                </section>

                <button disabled={saving || loading} onClick={handleSave}
                  className="w-full py-4 bg-gray-900 text-white text-sm font-bold rounded-2xl hover:bg-black disabled:opacity-30 shadow-lg shadow-gray-200 transition-all active:scale-[0.98]">
                  {saving ? "Processing..." : "Apply Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}