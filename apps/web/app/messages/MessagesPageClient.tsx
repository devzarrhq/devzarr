"use client";
import Link from "next/link";
import { useState } from "react";
import UserSearchModal from "./components/UserSearchModal";
import { Plus } from "lucide-react";

type Profile = {
  user_id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type Thread = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  other: Profile | null;
};

export default function MessagesPageClient({ rows }: { rows: Thread[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
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