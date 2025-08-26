"use client";

import { useState, useEffect, FormEvent } from "react";
import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { UserCircle, SearchIcon } from "lucide-react";
import { useAuth } from "../../providers/AuthProvider";

type Profile = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function UserSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    (async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .or(
          `handle.ilike.%${query.trim()}%,display_name.ilike.%${query.trim()}%`
        )
        .limit(10);
      if (error) setError("Failed to search users.");
      else setResults((data ?? []).filter((p) => p.user_id !== user?.id));
      setLoading(false);
    })();
  }, [query, user?.id]);

  const startDM = async (otherUserId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/messages/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId }),
      });
      const data = await res.json();
      if (data.threadId) {
        onClose();
        router.push(`/messages/${data.threadId}`);
      } else {
        setError(data.error || "Failed to start conversation.");
      }
    } catch {
      setError("Failed to start conversation.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="min-h-full grid place-items-center p-4">
        <Dialog.Panel className="relative w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl ring-1 ring-white/10">
          <Dialog.Title className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <SearchIcon className="w-5 h-5" />
            Start a New Conversation
          </Dialog.Title>
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              // No-op, search is live
            }}
            className="mb-4"
          >
            <input
              type="text"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
              placeholder="Search by handle or name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </form>
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-gray-400">Searching…</div>
            ) : results.length === 0 && query.trim() ? (
              <div className="text-gray-400">No users found.</div>
            ) : (
              <ul className="space-y-2">
                {results.map((p) => (
                  <li
                    key={p.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer"
                    onClick={() => startDM(p.user_id)}
                  >
                    {p.avatar_url ? (
                      <img
                        src={p.avatar_url}
                        alt={p.display_name || p.handle || "user"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <UserCircle className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-white">
                        {p.display_name || p.handle}
                      </div>
                      <div className="text-xs text-gray-400">
                        @{p.handle}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}