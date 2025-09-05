"use client";

import React, { useEffect, useState } from "react";
import { useTheme, ACCENT_COLORS } from "../theme-context";
import { Sun, Moon, Palette, LogOut, Pencil, UserCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../providers/AuthProvider";

export default function SettingsMenu({ onClose }: { onClose?: () => void }) {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<{
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("display_name, handle, avatar_url")
        .eq("user_id", user.id)
        .single();
      setProfile(data ?? null);
    })();
  }, [user]);

  const handleLogout = async () => {
    await supabaseBrowser().auth.signOut();
    router.replace("/login");
    onClose?.();
  };

  return (
    <div className="p-4 w-72 bg-gray-900 rounded-xl shadow-lg text-gray-100">
      {/* User info */}
      <div className="flex items-center gap-3 mb-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name || profile.handle || "avatar"}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <UserCircle className="w-7 h-7 text-gray-400" />
          </div>
        )}
        <div>
          <div className="font-semibold text-white text-base">
            {profile?.display_name || profile?.handle || user?.email || "User"}
          </div>
          <div className="text-xs text-gray-400">
            @{profile?.handle || user?.email?.split("@")[0] || ""}
          </div>
        </div>
      </div>
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
      <Link
        href="/profile/setup"
        className="w-full flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
        onClick={onClose}
      >
        <Pencil className="w-5 h-5" />
        Edit Profile
      </Link>
      <button
        className="w-full flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5" />
        Log out
      </button>
    </div>
  );
}