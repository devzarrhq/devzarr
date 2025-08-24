"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Pencil } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

type Profile = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  background_url: string | null;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  // Loading skeleton
  if (loading || !profile) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-800 animate-pulse mb-4" />
              <div className="h-6 w-40 bg-gray-700 rounded mb-2 animate-pulse" />
              <div className="h-4 w-64 bg-gray-700 rounded animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="max-w-xl w-full bg-gray-900 rounded-2xl shadow-2xl overflow-hidden mx-auto">
            {/* Background image */}
            <div className="relative h-44 bg-gray-800">
              {profile.background_url ? (
                <img
                  src={profile.background_url}
                  alt="Background"
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800" />
              )}
              {/* Avatar */}
              <div className="absolute -bottom-16 left-6">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || profile.handle}
                    className="w-32 h-32 rounded-full border-4 border-gray-900 object-cover bg-gray-700"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-gray-900 bg-gray-700" />
                )}
              </div>
            </div>
            {/* Profile details */}
            <div className="pt-20 pb-8 px-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold text-white">{profile.display_name || profile.handle}</span>
                <div className="ml-auto">
                  <button
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-blue hover:bg-accent-blue/80 text-white font-medium shadow transition"
                    // onClick={openEditModal} // To be implemented
                    type="button"
                  >
                    <Pencil size={16} />
                    Edit Profile
                  </button>
                </div>
              </div>
              <div className="text-gray-400 text-lg mb-2">@{profile.handle}</div>
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
              {/* Social stats */}
              <div className="flex gap-6 text-gray-300 text-sm mb-4">
                <span>
                  <span className="font-bold">0</span> Following
                </span>
                <span>
                  <span className="font-bold">0</span> Followers
                </span>
                <span>
                  <span className="font-bold">0</span> Cliques
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}