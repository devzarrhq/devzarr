"use client";

import { useState } from "react";
import { UserCircle, Menu } from "lucide-react";
import SettingsMenu from "./SettingsMenu";

export default function Topbar() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 py-3 md:ml-64">
      <div className="flex items-center gap-2 md:hidden">
        <button
          className="p-2 rounded-md hover:bg-gray-900"
          aria-label="Open sidebar"
          // Sidebar toggle logic for mobile (to be implemented)
        >
          <Menu className="w-6 h-6 text-gray-300" />
        </button>
        <span className="text-lg font-bold text-accent-blue">Devzarr</span>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-900"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Open settings"
        >
          <UserCircle className="w-8 h-8 text-gray-300" />
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