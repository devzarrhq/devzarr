"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../../theme-context";

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { accent } = useTheme();

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing profile if any
  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("handle, display_name, avatar_url, bio")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setHandle(data.handle || "");
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
      }
    })();
  }, [user]);

  const canSubmit = handle.trim().length > 0 && displayName.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit || !user) {
      setError("Handle and display name are required.");
      return;
    }
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { error: upError } = await supabase
        .from("profiles")
        .update({
          handle: handle.trim(),
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("user_id", user.id);
      if (upError) throw upError;
      router.replace("/"); // Go to main app
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <form
        className="bg-gray-900 rounded-2xl shadow-2xl px-8 py-10 max-w-md w-full flex flex-col gap-5"
        onSubmit={handleSubmit}
      >
        <h1
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: `var(--tw-color-accent-${accent})` }}
        >
          Complete Your Profile
        </h1>
        <p className="text-gray-300 text-center mb-2">
          Please fill in your profile details to get started.
        </p>
        <div>
          <label className="block text-gray-200 font-medium mb-1">
            Handle <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            maxLength={32}
            placeholder="your-handle"
            required
          />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={64}
            placeholder="Your Name"
            required
          />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">
            Avatar URL
          </label>
          <input
            className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
            maxLength={256}
            placeholder="https://image.host/avatar.png"
          />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">
            Bio
          </label>
          <textarea
            className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder="Tell us about yourself"
          />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full px-4 py-2 rounded font-semibold text-white disabled:opacity-50"
          style={{ background: `var(--tw-color-accent-${accent})` }}
          disabled={loading || !canSubmit}
        >
          {loading ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}