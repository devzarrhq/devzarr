"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../theme-context";
import { useAuth } from "../providers/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function AddProjectModal({ open, onClose, onCreated }: Props) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required.");
      setLoading(false);
      return;
    }
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("projects").insert({
      owner_id: user.id,
      name: name.trim(),
      slug: slug.trim(),
      summary: summary.trim() || null,
      url: url.trim() || null,
      cover_url: coverUrl.trim() || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_public: isPublic,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (onCreated) onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black/60" />
        <div className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-auto p-8 z-10">
          <Dialog.Title
            className="text-2xl font-bold mb-4"
            style={{ color: `var(--tw-color-accent-${accent})` }}
          >
            Add New Project
          </Dialog.Title>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-200 font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, "").toLowerCase())}
                required
                maxLength={50}
                placeholder="e.g. my-cool-tool"
              />
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">Summary</label>
              <textarea
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                maxLength={300}
              />
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">Project URL</label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
                placeholder="https://yourproject.com"
              />
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">Cover Image URL</label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                type="url"
                placeholder="https://image.com/cover.png"
              />
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">Tags (comma separated)</label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ai, cli, productivity"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="accent-blue-500"
              />
              <label htmlFor="isPublic" className="text-gray-200">
                Public project
              </label>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 mt-4">
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
                className="px-4 py-2 rounded font-semibold"
                style={{
                  background: `var(--tw-color-accent-${accent})`,
                  color: "#fff",
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}