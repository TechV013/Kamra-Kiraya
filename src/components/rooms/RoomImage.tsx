"use client";

import { useState } from "react";
import { getCityFallbackImage } from "@/lib/city-images";

const GLOBAL_FALLBACK = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";

interface RoomImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  city?: string | null;
}

export default function RoomImage({ src, alt, className = "", city }: RoomImageProps) {
  const cityFallback = getCityFallbackImage(city);
  const [imgSrc, setImgSrc] = useState(src || cityFallback);
  const [tried, setTried] = useState(false);

  const handleError = () => {
    if (!tried) {
      setTried(true);
      setImgSrc(cityFallback);
    } else if (imgSrc !== GLOBAL_FALLBACK) {
      setImgSrc(GLOBAL_FALLBACK);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
    />
  );
}
