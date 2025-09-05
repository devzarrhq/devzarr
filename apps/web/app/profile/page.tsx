"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useAuth } from "../providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Pencil, Palette } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useTheme, ACCENT_COLORS } from "../theme-context";
import type { AccentColor } from "../theme-context";
import RightSidebarWidgets from "../components/RightSidebarWidgets";

type Profile = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  background_url: string | null;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  accent?: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { accent, setAccent } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setHeaderUrl(data.background_url || null);
        if (data.accent && ACCENT_COLORS.includes(data.accent as AccentColor)) setAccent(data.accent as AccentColor);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user, setAccent]);

  // Header image upload
  async function handleHeaderUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingHeader(true);
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploadingHeader(false);
      return;
    }

    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/header.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) {
      setError("Failed to upload header image: " + uploadError.message);
      setUploadingHeader(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setHeaderUrl(data.publicUrl);

    // Save to profile
    await supabase.from("profiles").update({ background_url: data.publicUrl }).eq("user_id", user.id);
    setUploadingHeader(false);
    setProfile((p) => p ? { ...p, background_url: data.publicUrl } : p);
  }

  // Accent color change
  async function handleAccentChange(newAccent: AccentColor) {
    setAccent(newAccent);
    if (user) {
      await supabaseBrowser().from("profiles").update({ accent: newAccent }).eq("user_id", user.id);
      setProfile((p) => p ? { ...p, accent: newAccent } : p);
    }
  }

  // Loading skeleton
  if (loading || !profile) {
    return (
      <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex flex-1 flex-col min-h-screen">
          <Topbar />
          <div className="flex flex-1 flex-row">
            <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
              <main className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-800 animate-pulse mb-4" />
                  <div className="h-6 w-40 bg-gray-700 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-64 bg-gray-700 rounded animate-pulse" />
                </div>
              </main>
            </div>
            <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10 fixed right-0 top-0 h-full z-10">
              <RightSidebarWidgets />
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
            <main className="flex-1 flex flex-col items-center justify-start py-0">
              {/* Twitter-style header and avatar */}
              <div className="w-full max-w-2xl relative">
                {/* Header image */}
                <div className="h-48 sm:h-56 w-full bg-gray-800 relative">
                  {headerUrl ? (
                    <img
                      src={headerUrl}
                      alt="Header"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800" />
                  )}
                  {/* Header image upload (only for self) */}
                  <label className="absolute right-4 bottom-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-xs font-semibold cursor-pointer hover:bg-black/80">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHeaderUpload}
                      disabled={uploadingHeader}
                    />
                    {uploadingHeader ? "Uploading…" : "Change Header"}
                  </label>
                </div>
                {/* Avatar - overlaps header */}
                <div className="absolute left-6 -bottom-12 sm:-bottom-14 z-10">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-gray-900 shadow-lg"
                      style={{ background: "#222" }}
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-700 border-4 border-gray-900 shadow-lg flex items-center justify-center text-4xl text-gray-400">
                      ?
                    </div>
                  )}
                </div>
                {/* Edit Profile button */}
                <div className="absolute right-6 -bottom-8 sm:-bottom-10 z-10">
                  <a
                    href="/profile/setup"
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-accent-blue hover:bg-accent-blue/80 text-white font-bold text-base shadow transition"
                  >
                    <Pencil size={18} />
                    Edit Profile
                  </a>
                </div>
              </div>
              {/* Spacer for avatar overlap */}
              <div className="h-16 sm:h-20" />
              {/* Profile section */}
              <section className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: `var(--tw-color-accent-${accent})` }}>
                  Profile
                </h2>
                <div className="mb-2 text-gray-400 text-lg">@{profile.handle}</div>
                <div className="mb-2 text-white text-xl font-semibold">{profile.display_name}</div>
                {profile.tagline && (
                  <div className="text-gray-200 mb-2">{profile.tagline}</div>
                )}
                {profile.bio && (
                  <div className="text-gray-300 mb-4 whitespace-pre-line">{profile.bio}</div>
                )}
                <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block"><circle cx="8" cy="8" r="7" /></svg>
                      {profile.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block"><path d="M8 2v6l4 2" /></svg>
                    Joined {new Date(profile.created_at).toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </section>
              {/* Site Settings section */}
              <section className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4" style={{ color: `var(--tw-color-accent-${accent})` }}>
                  Site Settings
                </h2>
                <div className="mb-6">
                  <div className="font-medium mb-2 flex items-center gap-2">
                    <Palette size={18} /> Accent Color
                  </div>
                  <div className="flex flex-wrap gap-3 mb-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`w-7 h-7 rounded-full border-2 transition-colors duration-150 ${accent === c ? "border-white scale-110" : "border-gray-700"}`}
                        style={{ backgroundColor: `var(--tw-color-accent-${c})` }}
                        onClick={() => handleAccentChange(c as AccentColor)}
                        aria-label={c}
                        type="button"
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">Choose your site accent color.</div>
                </div>
                <div>
                  <div className="font-medium mb-2">Header Image</div>
                  <div className="flex items-center gap-3">
                    {headerUrl ? (
                      <img
                        src={headerUrl}
                        alt="header"
                        className="w-32 h-20 rounded object-cover border border-gray-700"
                      />
                    ) : (
                      <div className="w-32 h-20 rounded bg-gray-700" />
                    )}
                    <label className="px-4 py-2 rounded bg-gray-800 text-gray-200 hover:bg-gray-700 cursor-pointer text-sm font-semibold">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeaderUpload}
                        disabled={uploadingHeader}
                        className="hidden"
                      />
                      {uploadingHeader ? "Uploading…" : "Change Header"}
                    </label>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">This image appears at the top of your profile.</div>
                </div>
              </section>
              {error && <div className="text-red-400 text-sm text-center mb-2">{error}</div>}
            </main>
          </div>
          <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10 fixed right-0 top-0 h-full z-10">
            <RightSidebarWidgets />
          </aside>
        </div>
      </div>
    </div>
  );
}