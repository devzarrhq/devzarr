"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Clique = {
  id: string;
  name: string;
  slug: string;
  recent_msgs: number;
  member_count: number;
};

export default function ActiveCliquesWidget() {
  const [cliques, setCliques] = useState<Clique[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = supabaseBrowser();
      // Get cliques with most messages in last 30 min
      const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .rpc("active_cliques", { since })
        .limit(5);
      if (!error && data) setCliques(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/5 rounded-xl border border-gray-800 p-5 mb-6">
        <div className="h-6 w-2/3 bg-gray-700 rounded mb-2 animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-700 rounded mb-1 animate-pulse" />
        <div className="h-4 w-1/3 bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (!cliques.length) {
    return (
      <div className="bg-white/5 rounded-xl border border-gray-800 p-5 mb-6">
        <div className="font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-300" />
          Active Cliques
        </div>
        <div className="text-gray-400 text-sm">No active cliques right now.</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl border border-gray-800 p-5 mb-6">
      <div className="font-bold text-white mb-2 flex items-center gap-2">
        <Users className="w-5 h-5 text-emerald-300" />
        Active Cliques
      </div>
      <ul className="space-y-3">
        {cliques.map((c) => (
          <li key={c.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/cliques/${c.id}`} className="font-semibold text-white truncate hover:underline">
                {c.name}
              </Link>
              <div className="text-xs text-gray-400">
                {c.member_count} member{c.member_count === 1 ? "" : "s"} • {c.recent_msgs} msg{c.recent_msgs === 1 ? "" : "s"} last 30m
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-center">
        <Link
          href="/cliques"
          className="px-4 py-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold text-sm"
        >
          Join the conversation
        </Link>
      </div>
    </div>
  );
}