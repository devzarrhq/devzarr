"use client";

import { useState } from "react";
import { UserCircle, Menu } from "lucide-react";
import SettingsMenu from "./SettingsMenu";
import { useTheme } from "../theme-context";

export default function Topbar() {
  const [showSettings, setShowSettings] = useState(false);
  const { accent } = useTheme();

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 border-b border-gray-800 flex items-center justify-between px-6 py-3 md:ml-64">
      <div className="flex items-center gap-2 md:hidden">
        <button
          className="p-2 rounded-md hover:bg-gray-900"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" style={{ color: `var(--tw-color-accent-${accent})` }} />
        </button>
        <span className="text-lg font-bold" style={{ color: `var(--tw-color-accent-${accent})` }}>Devzarr</span>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-900"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Open settings"
        >
          <UserCircle className="w-8 h-8" style={{ color: `var(--tw-color-accent-${accent})` }} />
        </button>
        {showSettings && (
          <div className="absolute right-0 mt-2 z-50">
            <SettingsMenu />
          </div>
        )}
      </div>
    </header>
  );
}