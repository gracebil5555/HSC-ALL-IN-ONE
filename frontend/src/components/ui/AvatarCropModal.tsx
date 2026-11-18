"use client";

import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (croppedDataUrl: string) => Promise<void> | void;
}

const VIEW_SIZE = 256;

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onConfirm,
}) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setNaturalSize(null);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }, [isOpen, imageSrc]);

  const baseScale = naturalSize
    ? Math.max(VIEW_SIZE / naturalSize.w, VIEW_SIZE / naturalSize.h)
    : 1;
  const effectiveScale = baseScale * zoom;
  const renderedW = naturalSize ? naturalSize.w * effectiveScale : VIEW_SIZE;
  const renderedH = naturalSize ? naturalSize.h * effectiveScale : VIEW_SIZE;

  const clampOffset = (nx: number, ny: number, targetZoom = zoom) => {
    if (!naturalSize) return { x: 0, y: 0 };
    const scale = Math.max(VIEW_SIZE / naturalSize.w, VIEW_SIZE / naturalSize.h) * targetZoom;
    const rw = naturalSize.w * scale;
    const rh = naturalSize.h * scale;
    const maxX = Math.max(0, (rw - VIEW_SIZE) / 2);
    const maxY = Math.max(0, (rh - VIEW_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nx)),
      y: Math.min(maxY, Math.max(-maxY, ny)),
    };
  };

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.min(3, Math.max(1, Number(newZoom.toFixed(2))));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(clampOffset(dragStartRef.current.origX + dx, dragStartRef.current.origY + dy));
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    handleZoomChange(zoom + delta);
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !naturalSize) return;
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = VIEW_SIZE;
      canvas.height = VIEW_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, VIEW_SIZE, VIEW_SIZE);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      const drawX = (VIEW_SIZE - renderedW) / 2 + offset.x;
      const drawY = (VIEW_SIZE - renderedH) / 2 + offset.y;
      ctx.drawImage(imgRef.current, drawX, drawY, renderedW, renderedH);

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
      await onConfirm(croppedDataUrl);
    } finally {
      setSaving(false);
    }
  };

  const drawX = (VIEW_SIZE - renderedW) / 2 + offset.x;
  const drawY = (VIEW_SIZE - renderedH) / 2 + offset.y;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recadrer la photo de profil"
      description="Glissez l'image pour la centrer et ajustez le zoom."
      maxWidth="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleConfirm}
            isLoading={saving}
            disabled={!naturalSize}
          >
            Valider & Enregistrer
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Crop Viewport */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          style={{ width: VIEW_SIZE, height: VIEW_SIZE }}
          className={`relative overflow-hidden rounded-2xl bg-gray-900 select-none touch-none border border-gray-200 dark:border-gray-700 ${
            dragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Aperçu recadrage"
              draggable={false}
              onLoad={(e) => {
                const target = e.currentTarget;
                if (target.naturalWidth > 0) {
                  setNaturalSize({ w: target.naturalWidth, h: target.naturalHeight });
                }
              }}
              style={{
                position: "absolute",
                left: drawX,
                top: drawY,
                width: renderedW,
                height: renderedH,
                maxWidth: "none",
              }}
              className="pointer-events-none select-none"
            />
          )}

          {/* Circular framing guide */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/90"
            style={{
              boxShadow: "0 0 0 9999px rgba(16, 18, 21, 0.52)",
            }}
          />

          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
            <Move className="w-3 h-3" />
            <span>Glisser / Molette</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="w-full flex items-center gap-2.5 px-1">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.15)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Dézoomer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1 accent-brand-500 cursor-pointer"
            aria-label="Niveau de zoom"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.15)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Zoomer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Réinitialiser le cadrage"
            aria-label="Réinitialiser le cadrage"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
