"use client";

import { useEffect, useMemo, useState, FormEvent, ChangeEvent } from "react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../theme-context";
import { useAuth } from "../providers/AuthProvider";

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

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId?: string) => void;
  wide?: boolean;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isValidUrl(u: string) {
  if (!u) return true; // optional field
  try {
    new URL(u);
    return true;
  } catch {
    return false;
  }
}

export default function AddProjectModal({ open, onClose, onCreated, wide }: Props) {
  const router = useRouter();
  const { accent } = useTheme();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // slug availability state
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);

  // For upload progress
  const [uploadingCover, setUploadingCover] = useState(false);

  // auto-generate slug as you type the name (unless user overrides)
  useEffect(() => {
    if (!open) return;
    // only auto-set if user hasn't typed slug manually
    setSlug((prev) => (prev ? prev : slugify(name)));
  }, [name, open]);

  // debounce check slug uniqueness (global)
  useEffect(() => {
    if (!slug) {
      setSlugTaken(false);
      return;
    }
    let id = setTimeout(async () => {
      try {
        setCheckingSlug(true);
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("slug", slug);
        if (error) throw error;
        setSlugTaken((data as any) === null ? false : (data as any).length > 0); // head:true returns null rows; rely on count via error-free request
      } catch {
        // if RLS prevents global check, fall back to optimistic
        setSlugTaken(false);
      } finally {
        setCheckingSlug(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [slug]);

  const canSubmit = useMemo(() => {
    const hasBasics = name.trim().length > 0 && slug.trim().length > 0;
    return hasBasics && !slugTaken && isValidUrl(url) && isValidUrl(coverUrl) && !!user;
  }, [name, slug, slugTaken, url, coverUrl, user]);

  const suggestAnother = () => {
    const n = Math.floor(Math.random() * 9000 + 1000);
    setSlug((s) => (s ? `${s}-${n}` : `project-${n}`));
  };

  // --- Cover image upload handler ---
  async function handleCoverUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingCover(true);
    setError(null);

    // Check MIME type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploadingCover(false);
      return;
    }
    // Check file header
    if (!(await isValidImageFile(file))) {
      setError("File does not appear to be a valid image.");
      setUploadingCover(false);
      return;
    }

    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    // Use slug or random string for filename
    const safeSlug = slug || `project-${Math.random().toString(36).slice(2, 8)}`;
    const filePath = `${user.id}/${safeSlug}-cover.${fileExt}`;
    // Upload to 'project-covers' bucket
    const { error: uploadError } = await supabase.storage.from("project-covers").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) {
      setError("Failed to upload cover image: " + uploadError.message);
      setUploadingCover(false);
      return;
    }
    const { data } = supabase.storage.from("project-covers").getPublicUrl(filePath);
    setCoverUrl(data.publicUrl);
    setUploadingCover(false);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          owner_id: user!.id,
          name: name.trim(),
          slug: slug.trim(),
          summary: summary.trim() || null,
          url: url.trim() || null,
          cover_url: coverUrl.trim() || null,
          tags: tagsArray,        // assumes text[] in schema
          is_public: isPublic,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const projectId = data?.id as string | undefined;
      // remember this project for future posts
      if (projectId) localStorage.setItem("dz:lastProjectId", projectId);

      onClose();
      onCreated?.(projectId);
      router.refresh();
      // optional: router.push(`/projects/${slug}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to add project.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      {/* Centered modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-gray-900 p-6 md:p-8 shadow-2xl ring-1 ring-white/10`}
          style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
        >
          <Dialog.Title
            className="text-xl md:text-2xl font-bold mb-4"
            style={{ color: `var(--tw-color-accent-${accent})` }}
          >
            Add New Project
          </Dialog.Title>

          <form
            className="space-y-4"
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
            }}
          >
            <div>
              <label htmlFor="name" className="block text-gray-200 font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label htmlFor="slug" className="block text-gray-200 font-medium mb-1">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="slug"
                    className={`w-full px-3 py-2 rounded bg-gray-800 text-white border focus:outline-none focus:ring-2 ${
                      slugTaken ? "border-red-500" : "border-gray-700"
                    }`}
                    style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    maxLength={50}
                    placeholder="e.g. my-cool-tool"
                  />
                  <div className="mt-1 text-xs">
                    {checkingSlug ? (
                      <span className="text-gray-400">Checking availability…</span>
                    ) : slug && slugTaken ? (
                      <span className="text-red-400">That slug is taken.</span>
                    ) : slug ? (
                      <span className="text-emerald-400/90">Looks good.</span>
                    ) : (
                      <span className="text-gray-400">Only letters, numbers, and dashes.</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={suggestAnother}
                  className="h-10 px-3 rounded bg-white/5 text-sm text-gray-200 ring-1 ring-white/10 hover:bg-white/10"
                >
                  Suggest
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="summary" className="block text-gray-200 font-medium mb-1">Summary</label>
              <textarea
                id="summary"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="One or two sentences about your project"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="url" className="block text-gray-200 font-medium mb-1">Project URL</label>
                <input
                  id="url"
                  className={`w-full px-3 py-2 rounded bg-gray-800 text-white border focus:outline-none focus:ring-2 ${
                    isValidUrl(url) ? "border-gray-700" : "border-red-500"
                  }`}
                  style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  type="url"
                  placeholder="https://yourproject.com"
                />
              </div>
              <div>
                <label htmlFor="cover" className="block text-gray-200 font-medium mb-1">Cover Image</label>
                <div className="flex items-center gap-3">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="cover"
                      className="w-20 h-12 rounded object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-20 h-12 rounded bg-gray-700" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={uploadingCover}
                    className="block text-sm text-gray-400"
                  />
                  {uploadingCover && <span className="text-xs text-gray-400">Uploading…</span>}
                </div>
                <input
                  id="coverUrl"
                  className={`mt-2 w-full px-3 py-2 rounded bg-gray-800 text-white border focus:outline-none focus:ring-2 ${
                    isValidUrl(coverUrl) ? "border-gray-700" : "border-red-500"
                  }`}
                  style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  type="url"
                  placeholder="Or paste an image URL"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tags" className="block text-gray-200 font-medium mb-1">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, cli, productivity"
              />
              <p className="mt-1 text-xs text-gray-400">Used for discovery and badge hints.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-emerald-500"
              />
              <label htmlFor="isPublic" className="text-gray-200">
                Public project
              </label>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded font-semibold text-white disabled:opacity-50"
                style={{ background: `var(--tw-color-accent-${accent})` }}
                disabled={loading || !canSubmit || checkingSlug}
              >
                {loading ? "Adding…" : "Add Project"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}