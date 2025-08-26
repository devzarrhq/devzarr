"use client";

import React from "react";
import { useTheme, ACCENT_COLORS } from "../theme-context";
import { Sun, Moon, Palette, LogOutIcon } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsMenu() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="p-4 w-72 bg-gray-900 rounded-xl shadow-lg text-gray-100">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Theme</span>
          <div className="flex gap-2">
            <button
              className={`p-2 rounded-full ${theme === "light" ? "bg-accent-" + accent + " text-white" : "bg-gray-800 text-gray-300"}`}
              onClick={() => setTheme("light")}
              aria-label="Light mode"
            >
              <Sun size={18} />
            </button>
            <button
              className={`p-2 rounded-full ${theme === "dark" ? "bg-accent-" + accent + " text-white" : "bg-gray-800 text-gray-300"}`}
              onClick={() => setTheme("dark")}
              aria-label="Dark mode"
            >
              <Moon size={18} />
            </button>
          </div>
        </div>
      </div>
      <div>
        <div className="font-medium mb-2 flex items-center gap-2">
          <Palette size={18} /> Accent Color
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              className={`w-7 h-7 rounded-full border-2 ${accent === c ? "border-white" : "border-gray-700"}`}
              style={{ backgroundColor: `var(--tw-color-accent-${c})` }}
              onClick={() => setAccent(c)}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <button
        className="w-full flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        onClick={handleLogout}
      >
        <LogOutIcon className="w-5 h-5" />
        Log out
      </button>
    </div>
  );
}