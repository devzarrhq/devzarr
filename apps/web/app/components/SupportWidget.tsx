"use client";
import { Heart } from "lucide-react";
import { useTheme } from "../theme-context";

export default function SupportWidget() {
  const { accent } = useTheme();
  return (
    <div className="bg-white/5 rounded-xl border border-gray-800 p-5 mb-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-5 h-5 text-pink-400" />
        <span className="font-bold text-white">Support This Dev</span>
      </div>
      <div className="text-gray-300 text-sm mb-4 text-center">
        Help keep the bazaar alive—support indie devs.
      </div>
      <a
        href="https://ko-fi.com/devzarr"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center px-4 py-2 rounded-lg text-white font-semibold transition hover:opacity-90"
        style={{ background: `var(--tw-color-accent-${accent})` }}
      >
        Donate via Ko-fi
      </a>
      {/* Stripe button placeholder */}
      {/* <button className="w-full mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">Support via Stripe</button> */}
    </div>
  );
}