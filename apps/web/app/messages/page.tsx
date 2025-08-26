"use client";
import Link from "next/link";
import { useState } from "react";
import { createSupabaseServer } from "@/lib/supabase/server";
import UserSearchModal from "./components/UserSearchModal";
import { Plus } from "lucide-react";

export default async function MessagesPage() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-8 text-gray-300">Sign in to use DMs.</div>;

  const { data: threads } = await supabase
    .from("dm_threads")
    .select("id, user_a, user_b, created_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const otherIds = (threads ?? []).map(t => (t.user_a === user.id ? t.user_b : t.user_a));
  const { data: profs } = otherIds.length
    ? await supabase.from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", otherIds)
    : { data: [] as any[] };

  const rows = (threads ?? []).map(t => {
    const other = profs?.find(p => p.user_id === (t.user_a === user.id ? t.user_b : t.user_a));
    return { ...t, other };
  });

  // Client state for modal
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/90 text-white font-semibold hover:bg-emerald-500"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-5 h-5" />
          New Message
        </button>
      </div>
      <UserSearchModal open={showModal} onClose={() => setShowModal(false)} />
      <ul className="space-y-3">
        {rows.map(r => (
          <li key={r.id} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-4">
            <Link href={`/messages/${r.id}`} className="flex items-center gap-3">
              {r.other?.avatar_url ? (
                <img src={r.other.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : <div className="h-9 w-9 rounded-full bg-gray-700" />}
              <div className="text-gray-100">
                {r.other?.display_name || r.other?.handle || "User"}
                <div className="text-xs text-gray-400">@{r.other?.handle}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}