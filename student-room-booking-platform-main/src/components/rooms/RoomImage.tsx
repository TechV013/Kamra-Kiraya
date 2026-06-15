"use client";

import { useState } from "react";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80";

interface RoomImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export default function RoomImage({ src, alt, className = "" }: RoomImageProps) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);
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
          setImgSrc(FALLBACK_IMAGE);
        }
      }}
    />
  );
}
