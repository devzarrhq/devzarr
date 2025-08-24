"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useTheme } from "../theme-context";
import { useAuth } from "../providers/AuthProvider";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  wide?: boolean;
};

type Project = { id: string; name: string };

export default function AddPostModal({ open, onClose, onCreated, wide }: Props) {
  const router = useRouter();
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
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      const list = data ?? [];
      setProjects(list);

      // restore last-used project if still present
      const last = localStorage.getItem("dz:lastProjectId");
      if (last && list.some(p => p.id === last)) setProjectId(last);
      else if (list.length) setProjectId(list[0].id);
      else setProjectId("");
    })();
  }, [user, open]);

  // simple form validity
  const canSubmit = useMemo(
    () => !!projectId && (!!title.trim() || !!body.trim()),
    [projectId, title, body]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canSubmit || !user) {
      setError(!user ? "You must be logged in." : "Pick a project and add a title or body.");
      return;
    }

    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      const { error: insertError } = await supabase.from("posts").insert({
        project_id: projectId,
        author_id: user.id,
        title: title.trim() || null,
        body: body.trim() || null,
      });
      if (insertError) throw insertError;

      localStorage.setItem("dz:lastProjectId", projectId);
      setTitle(""); setBody("");
      onClose();
      onCreated?.();
      router.refresh(); // repaint feed
    } catch (err: any) {
      setError(err?.message ?? "Failed to post.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="min-h-full grid place-items-center p-4">
        <Dialog.Panel
          className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} rounded-2xl bg-gray-900 p-6 md:p-8 shadow-2xl ring-1 ring-white/10`}
          // set Tailwind ring color dynamically
          style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
        >
          <Dialog.Title
            className="text-xl md:text-2xl font-bold mb-4"
            style={{ color: `var(--tw-color-accent-${accent})` }}
          >
            Add New Post
          </Dialog.Title>

          {projects.length === 0 ? (
            <div className="mb-4 text-gray-300">
              You don’t have any projects yet.
              <a
                href="/projects/new"
                className="ml-3 inline-flex items-center rounded-lg bg-emerald-500/90 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                + Create project
              </a>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(e);
            }}
          >
            <div>
              <label htmlFor="project" className="block text-gray-200 font-medium mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                id="project"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
                {projects.length === 0 && <option value="">No projects found</option>}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-gray-200 font-medium mb-1">Title</label>
              <input
                id="title"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Post title (optional)"
              />
            </div>

            <div>
              <label htmlFor="body" className="block text-gray-200 font-medium mb-1">Body</label>
              <textarea
                id="body"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: `var(--tw-color-accent-${accent})` }}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="What's new? (required if no title)"
              />
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
                disabled={loading || !canSubmit}
              >
                {loading ? "Posting..." : "Add Post"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}