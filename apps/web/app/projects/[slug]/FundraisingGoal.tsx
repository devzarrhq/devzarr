"use client";
import { useEffect, useRef } from "react";

export default function FundraisingGoal({ goalAmount }: { goalAmount: number }) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const amountRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Get accent from localStorage or fallback
    const accent = localStorage.getItem("accent") || "emerald";
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--tw-color-accent-${accent}`) || "#10b981";
    if (labelRef.current) labelRef.current.style.color = color;
    if (amountRef.current) amountRef.current.style.color = color;
  }, []);

  return (
    <div className="flex items-center gap-4">
      <span ref={labelRef} className="text-lg font-semibold">
        Fundraising Goal:
      </span>
      <span ref={amountRef} className="text-lg font-bold">
        ${goalAmount.toLocaleString()}
      </span>
    </div>
  );
}