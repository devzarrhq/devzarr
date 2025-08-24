"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ParallaxBackground({
  src,
  alt,
  overlay = "from-gray-900/60 to-gray-950/95",
  children,
  className = "",
}: {
  src: string;
  alt: string;
  overlay?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Parallax factor (subtle; tweak as you like)
  const y = Math.min(200, offset * 0.18);

  return (
    <div className={`relative w-full h-full min-h-screen ${className}`}>
      {/* Parallax background image */}
      <Image
        src={src}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover will-change-transform"
        style={{ transform: `translateY(${y}px)` }}
      />
      {/* Overlay for readability */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlay}`} />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}