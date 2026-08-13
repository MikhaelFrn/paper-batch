import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/i18n";

// On-screen crop square, and the exported image's pixel size. Output is
// deliberately larger than the viewport (avatars get upscaled/displayed at
// various sizes around the app) but still small — no point exporting
// something huge for a profile picture.
const VIEWPORT_SIZE = 280;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface Offset {
  x: number;
  y: number;
}

function clampOffset(offset: Offset, displayW: number, displayH: number): Offset {
  const maxX = Math.max(0, (displayW - VIEWPORT_SIZE) / 2);
  const maxY = Math.max(0, (displayH - VIEWPORT_SIZE) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export interface AvatarCropDialogProps {
  /** The just-picked file, or null to keep the dialog closed. Controlled
   * by the caller so picking a new file always reopens fresh. */
  file: File | null;
  onCancel: () => void;
  onCropped: (blob: Blob) => void;
}

/** A square crop/zoom/pan step between "picked a file" and "uploaded it" —
 * without this, a non-square source photo just gets squashed to fit the
 * circular avatar (see AvatarImage's aspect-square). Always shown, even
 * for an already-square source, same as Discord's avatar picker: consistent
 * behavior beats conditionally skipping a step depending on input shape. */
export function AvatarCropDialog({ file, onCancel, onCropped }: AvatarCropDialogProps) {
  const { t } = useTranslation();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startOffset: Offset } | null>(null);

  useEffect(() => {
    if (!file) {
      setImgUrl(null);
      setNaturalSize(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    const img = new Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // "Cover" baseline (same idea as CSS object-fit: cover) — the smallest
  // scale at which the image fully fills the square viewport with no gaps.
  // `zoom` (1..3, from the slider) multiplies on top of this.
  const baseScale = useMemo(() => {
    if (!naturalSize) return 1;
    return Math.max(VIEWPORT_SIZE / naturalSize.w, VIEWPORT_SIZE / naturalSize.h);
  }, [naturalSize]);
  const scale = baseScale * zoom;
  const displayW = (naturalSize?.w ?? 0) * scale;
  const displayH = (naturalSize?.h ?? 0) * scale;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset };
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset(
      clampOffset(
        { x: dragRef.current.startOffset.x + dx, y: dragRef.current.startOffset.y + dy },
        displayW,
        displayH,
      ),
    );
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  };

  const handleZoomChange = ([nextZoom]: number[]) => {
    if (!naturalSize || nextZoom === undefined) return;
    const nextScale = baseScale * nextZoom;
    setOffset(clampOffset(offset, naturalSize.w * nextScale, naturalSize.h * nextScale));
    setZoom(nextZoom);
  };

  const handleSave = () => {
    if (!naturalSize || !imgUrl) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Map the visible viewport square back to source-image pixel
    // coordinates — the inverse of how the <img> is positioned below
    // (centered, then shifted by `offset`, at `scale`).
    const halfVisible = VIEWPORT_SIZE / (2 * scale);
    const sx = naturalSize.w / 2 - halfVisible - offset.x / scale;
    const sy = naturalSize.h / 2 - halfVisible - offset.y / scale;
    const sSize = VIEWPORT_SIZE / scale;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      canvas.toBlob(
        (blob) => {
          if (blob) onCropped(blob);
        },
        "image/jpeg",
        0.92,
      );
    };
    img.src = imgUrl;
  };

  return (
    <Dialog
      open={!!file}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.avatarCrop.adjustPicture}</DialogTitle>
        </DialogHeader>

        {imgUrl && (
          <div
            className="relative mx-auto touch-none select-none overflow-hidden rounded-full bg-black"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img
              src={imgUrl}
              alt=""
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none cursor-grab active:cursor-grabbing"
              style={{
                width: displayW,
                height: displayH,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          </div>
        )}

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground">{t.avatarCrop.zoom}</span>
          <Slider
            value={[zoom]}
            onValueChange={handleZoomChange}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            aria-label={t.avatarCrop.zoom}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSave}>{t.common.save}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
