"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ParallaxBanner({
  src,
  alt,
  heightClass = "h-[50vh]",
  overlay = "from-gray-900/60 to-gray-950/90",
  children,
}: {
  src: string;
  alt: string;
  heightClass?: string;
  overlay?: string;
  children?: React.ReactNode;
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Parallax factor (subtle; tweak as you like)
  const y = Math.min(100, offset * 0.25);

  return (
    <header className={`relative ${heightClass} overflow-hidden`}>
      {/* Background image */}
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
      <div className="relative z-10 flex h-full items-center justify-center">
        {children}
      </div>
    </header>
  );
}