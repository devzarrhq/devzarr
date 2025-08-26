"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../../theme-context";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";

// Helper: check file header for common image types
async function isValidImageFile(file: File): Promise<boolean> {
  const signatures: { [key: string]: number[][] } = {
    jpg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]],
    bmp: [[0x42, 0x4D]],
    svg: [[0x3C, 0x73, 0x76, 0x67]], // "<svg"
  };
  const buf = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buf);
  for (const sigs of Object.values(signatures)) {
    for (const sig of sigs) {
      if (bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b)) {
        return true;
      }
    }
  }
  return false;
}

export default function ProfileSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { accent } = useTheme();

  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [tagline, setTagline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For upload progress
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  // Load existing profile if any
  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("profiles")
        .select("handle, display_name, avatar_url, background_url, tagline, location, bio")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setHandle(data.handle || "");
        setDisplayName(data.display_name || "");
        setAvatarUrl(data.avatar_url || "");
        setBackgroundUrl(data.background_url || "");
        setTagline(data.tagline || "");
        setLocation(data.location || "");
        setBio(data.bio || "");
      }
    })();
  }, [user]);

  const canSubmit = handle.trim().length > 0 && displayName.trim().length > 0;

  // --- Upload handlers ---
  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    setError(null);

    // Check MIME type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploadingAvatar(false);
      return;
    }
    // Check file header
    if (!(await isValidImageFile(file))) {
      setError("File does not appear to be a valid image.");
      setUploadingAvatar(false);
      return;
    }

    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (error) {
      console.error("Supabase avatar upload error:", error);
      setError("Failed to upload avatar: " + error.message);
      setUploadingAvatar(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploadingAvatar(false);
  }

  async function handleBgUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingBg(true);
    setError(null);

    // Check MIME type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploadingBg(false);
      return;
    }
    // Check file header
    if (!(await isValidImageFile(file))) {
      setError("File does not appear to be a valid image.");
      setUploadingBg(false);
      return;
    }

    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/background.${fileExt}`;
    const { error } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (error) {
      console.error("Supabase background upload error:", error);
      setError("Failed to upload background image: " + error.message);
      setUploadingBg(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setBackgroundUrl(data.publicUrl);
    setUploadingBg(false);
  }

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
          background_url: backgroundUrl.trim() || null,
          tagline: tagline.trim() || null,
          location: location.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("user_id", user.id);
      if (upError) throw upError;
      router.refresh(); // <--- This will force all components to re-fetch data
    } catch (err: any) {
      setError(err?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col md:flex-row gap-0">
          {/* Center column: Profile setup form */}
          <section className="flex-1 flex flex-col items-center justify-start py-10">
            <div className="w-full max-w-xl px-4">
              <h1
                className="text-3xl md:text-4xl font-extrabold mb-2 text-center"
                style={{ color: `var(--tw-color-accent-${accent})` }}
              >
                Edit Profile
              </h1>
              <p className="text-gray-300 text-center mb-6">
                Please fill in your profile details to get started.
              </p>
              <form
                className="bg-gray-900 rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col gap-5"
                onSubmit={handleSubmit}
              >
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
                    Avatar
                  </label>
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="block text-sm text-gray-400"
                    />
                    {uploadingAvatar && <span className="text-xs text-gray-400">Uploading…</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-200 font-medium mb-1">
                    Background Image
                  </label>
                  <div className="flex items-center gap-3">
                    {backgroundUrl ? (
                      <img src={backgroundUrl} alt="background" className="w-20 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-20 h-12 rounded bg-gray-700" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgUpload}
                      disabled={uploadingBg}
                      className="block text-sm text-gray-400"
                    />
                    {uploadingBg && <span className="text-xs text-gray-400">Uploading…</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-gray-200 font-medium mb-1">
                    Tagline
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                    value={tagline}
                    onChange={e => setTagline(e.target.value)}
                    maxLength={100}
                    placeholder="Your tagline (e.g. Indie hacker, AI enthusiast)"
                  />
                </div>
                <div>
                  <label className="block text-gray-200 font-medium mb-1">
                    Location
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    maxLength={100}
                    placeholder="Where are you?"
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
          </section>
          {/* Right column: reserved for widgets */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0 px-6 py-10">
            {/* Future: Latest Projects, Featured Projects, etc. */}
          </aside>
        </main>
      </div>
    </div>
  );
}