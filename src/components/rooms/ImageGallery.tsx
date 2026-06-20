"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "lucide-react";

const FALLBACK = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export default function ImageGallery({ images, className = "" }: ImageGalleryProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  const safeImages = images?.length > 0 ? images : [FALLBACK];

  const prev = useCallback(() => {
    setImgIdx((i) => (i > 0 ? i - 1 : safeImages.length - 1));
  }, [safeImages.length]);

  const next = useCallback(() => {
    setImgIdx((i) => (i < safeImages.length - 1 ? i + 1 : 0));
  }, [safeImages.length]);

  const openLightbox = (i: number) => {
    setLbIdx(i);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") setLbIdx((i) => (i > 0 ? i - 1 : safeImages.length - 1));
      if (e.key === "ArrowRight") setLbIdx((i) => (i < safeImages.length - 1 ? i + 1 : 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, safeImages.length]);

  if (safeImages.length === 0) return null;

  return (
    <>
      {/* Main Image */}
      <div className={`relative rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 group ${className}`}>
        <motion.img
          key={imgIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={safeImages[imgIdx]}
          alt=""
          onClick={() => openLightbox(imgIdx)}
          className="w-full h-full object-cover cursor-pointer"
        />

        {safeImages.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-white">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`h-2 rounded-full transition-all ${i === imgIdx ? "w-5 bg-white" : "w-2 bg-white/60"}`}
                />
              ))}
            </div>
            <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium">
              {imgIdx + 1}/{safeImages.length}
            </span>
          </>
        )}

        {/* Expand button */}
        <button
          onClick={() => openLightbox(imgIdx)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {safeImages.map((src, i) => (
            <button key={i} onClick={() => setImgIdx(i)} className="shrink-0">
              <img
                src={src}
                alt=""
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
                className={`w-20 h-16 rounded-xl object-cover transition-all ${i === imgIdx ? "ring-2 ring-maroon-500" : "opacity-60 hover:opacity-80"}`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); setLbIdx((i) => (i > 0 ? i - 1 : safeImages.length - 1)); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            >
              <ChevronLeft className="w-7 h-7" />
            </button>

            <motion.img
              key={lbIdx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={safeImages[lbIdx]}
              alt=""
              onClick={(e) => e.stopPropagation()}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            />

            <button
              onClick={(e) => { e.stopPropagation(); setLbIdx((i) => (i < safeImages.length - 1 ? i + 1 : 0)); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 z-10"
            >
              <ChevronRight className="w-7 h-7" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLbIdx(i); }}
                  className={`h-2 rounded-full transition-all ${i === lbIdx ? "w-6 bg-white" : "w-2 bg-white/40"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
