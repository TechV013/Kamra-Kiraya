"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SplitType from "split-type";

export default function AnimatedTitle() {
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const split = new SplitType(textRef.current, {
      types: "chars",
    });

    gsap.from(split.chars, {
      opacity: 0,
      y: 100,
      rotateX: -90,
      stagger: 0.03,
      duration: 1,
      ease: "power4.out",
    });

    return () => {
      split.revert();
    };
  }, []);

  return (
    <h1
      ref={textRef}
      className="text-5xl md:text-7xl font-bold leading-tight"
    >
      Find Your Perfect Stay
    </h1>
  );
}