"use client";

import { useState, FormEvent } from "react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Users, Plus } from "lucide-react";
import { useTheme } from "../theme-context";
import { useAuth } from "../providers/AuthProvider";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AddCliqueModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugTaken, setSlugTaken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { accent } = useTheme();
  const { user } = useAuth();

  // Auto-generate slug as you type the name (unless user overrides)
  function handleNameChange(val: string) {
    setName(val);
    if (!slug) setSlug(slugify(val));
  }

  // Check slug uniqueness
  async function checkSlug(s: string) {
    if (!s) return setSlugTaken(false);
    setCheckingSlug(true);
    try {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("cliques")
        .select("id", { count: "exact", head: true })
        .eq("slug", s);
      if (error) throw error;
      setSlugTaken((data as any) === null ? false : (data as any).length > 0);
    } catch {
      setSlugTaken(false);
    } finally {
      setCheckingSlug(false);
    }
  }

  // Debounce slug check
  function handleSlugChange(val: string) {
    const s = slugify(val);
    setSlug(s);
    setSlugTaken(false);
    if (s) checkSlug(s);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    if (!name.trim() || !slug.trim() || slugTaken) {
      setError("Please provide a unique name and slug.");
      return;
    }
    setLoading(true);
    try {
      const supabase = supabaseBrowser();
      // 1. Create the clique
      const { data, error: insertError } = await supabase
        .from("cliques")
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          owner_id: user.id, // Ensure owner_id is set
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // 2. Add creator as owner in clique_members
      if (data?.id) {
        await supabase.from("clique_members").insert({
          clique_id: data.id,
          user_id: user.id,
          role: "owner",
        });
      }

      setOpen(false);
      setName(""); setSlug(""); setDescription("");
      router.push(`/cliques/${data.id}`);
    } catch (err: any) {
      setError(err?.message ?? "Failed to create clique.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-md transition-colors text-sm md:text-base"
        style={{ background: `var(--tw-color-accent-${accent})`, color: "#fff" }}
        onClick={() => setOpen(true)}
      >
        <Plus className="w-5 h-5" />
        Create Clique
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        <div className="min-h-full grid place-items-center p-4">
          <Dialog.Panel className="relative w-full max-w-lg rounded-2xl bg-gray-900 p-6 md:p-8 shadow-2xl ring-1 ring-white/10">
            <Dialog.Title
              className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2"
              style={{ color: `var(--tw-color-accent-${accent})` }}
            >
              <Users className="w-6 h-6" />
              Create a Clique
            </Dialog.Title>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-gray-200 font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  maxLength={100}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="slug" className="block text-gray-200 font-medium mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  className={`w-full px-3 py-2 rounded bg-gray-800 text-white border focus:outline-none focus:ring-2 ${
                    slugTaken ? "border-red-500" : "border-gray-700"
                  }`}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. indie-hackers"
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
              <div>
                <label htmlFor="description" className="block text-gray-200 font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="What is this clique about?"
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-700 text-gray-200 hover:bg-gray-600"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-semibold text-white disabled:opacity-50"
                  style={{ background: `var(--tw-color-accent-${accent})` }}
                  disabled={loading || !name.trim() || !slug.trim() || slugTaken}
                >
                  {loading ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}