"use client";

import { useState } from "react";
import { getCityFallbackImage } from "@/lib/city-images";

interface RoomImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  city?: string | null;
}

export default function RoomImage({ src, alt, className = "", city }: RoomImageProps) {
  const fallback = getCityFallbackImage(city);
  const [imgSrc, setImgSrc] = useState(src || fallback);
  const [tried, setTried] = useState(false);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!tried) {
          setTried(true);
          setImgSrc(fallback);
        }
      }}
    />
  );
}
