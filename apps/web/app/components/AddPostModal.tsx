"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../theme-context";
import { useAuth } from "../providers/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type Project = {
  id: string;
  name: string;
};

export default function AddPostModal({ open, onClose, onCreated }: Props) {
  const { accent } = useTheme();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's projects
  useEffect(() => {
    if (!user || !open) return;
    const fetchProjects = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setProjects(data);
      if (data && data.length > 0) setProjectId(data[0].id);
    };
    fetchProjects();
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!projectId) {
      setError("Please select a project.");
      setLoading(false);
      return;
    }
    if (!title.trim() && !body.trim()) {
      setError("Title or body is required.");
      setLoading(false);
      return;
    }
    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const supabase = supabaseBrowser();
    const { error: insertError } = await supabase.from("posts").insert({
      project_id: projectId,
      author_id: user.id,
      title: title.trim() || null,
      body: body.trim() || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (onCreated) onCreated();
    onClose();
    setTitle("");
    setBody("");
    setProjectId(projects.length > 0 ? projects[0].id : "");
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
            Add New Post
          </Dialog.Title>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-200 font-medium mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                {projects.length === 0 && (
                  <option value="">No projects found</option>
                )}
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">Title</label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Post title (optional)"
              />
            </div>
            <div>
              <label className="block text-gray-200 font-medium mb-1">Body</label>
              <textarea
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="What's new? (required if no title)"
              />
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
                {loading ? "Posting..." : "Add Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Dialog>
  );
}