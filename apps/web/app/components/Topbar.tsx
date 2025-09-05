"use client";

import { useRef, useState, useEffect } from "react";
import { UserCircle, Menu } from "lucide-react";
import SettingsMenu from "./SettingsMenu";
import { useTheme } from "../theme-context";
import { useAuth } from "../providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Topbar() {
  const [showSettings, setShowSettings] = useState(false);
  const { accent } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch avatar
  useEffect(() => {
    if (!user) return setAvatarUrl(null);
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      setAvatarUrl(data?.avatar_url ?? null);
    })();
  }, [user]);

  // Close menu on outside click or ESC
  useEffect(() => {
    if (!showSettings) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if (
        e instanceof MouseEvent &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
      }
      if (e instanceof KeyboardEvent && e.key === "Escape") {
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handle);
    };
  }, [showSettings]);

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
      <div className="relative" ref={menuRef}>
        <button
          className="flex items-center gap-2 px-1 py-1 rounded-full hover:bg-gray-900 focus:outline-none focus:ring-2"
          onClick={() => setShowSettings((v) => !v)}
          aria-label="Open settings"
          aria-haspopup="true"
          aria-expanded={showSettings}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border-2"
              style={{ borderColor: `var(--tw-color-accent-${accent})`, width: 32, height: 32 }}
            />
          ) : (
            <UserCircle className="w-8 h-8" style={{ color: `var(--tw-color-accent-${accent})` }} />
          )}
        </button>
        {showSettings && (
          <div className="absolute right-0 mt-2 z-50">
            <SettingsMenu onClose={() => setShowSettings(false)} />
          </div>
        )}
      </div>
    </header>
  );
}