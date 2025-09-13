"use client";

import { useState, FormEvent } from "react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../../providers/AuthProvider";

export default function AddUpdateModal({
  open,
  onClose,
  projectId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!(title.trim() || body.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    if (!canSubmit) {
      setError("Please enter a title or body.");
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
      setTitle("");
      setBody("");
      onClose();
      onCreated?.();
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add update.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="min-h-full grid place-items-center p-4">
        <Dialog.Panel className="relative w-full max-w-lg rounded-2xl bg-gray-900 p-6 md:p-8 shadow-2xl ring-1 ring-white/10">
          <Dialog.Title className="text-xl md:text-2xl font-bold mb-4 text-emerald-300">
            Add Project Update
          </Dialog.Title>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title" className="block text-gray-200 font-medium mb-1">
                Title
              </label>
              <input
                id="title"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="Update title (optional)"
              />
            </div>
            <div>
              <label htmlFor="body" className="block text-gray-200 font-medium mb-1">
                Body
              </label>
              <textarea
                id="body"
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
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
                className="px-4 py-2 rounded font-semibold text-white disabled:opacity-50 bg-emerald-500"
                disabled={loading || !canSubmit}
              >
                {loading ? "Posting..." : "Add Update"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}