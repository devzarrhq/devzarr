"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Project = {
  id: string;
  name: string;
  slug: string;
  cover_url: string | null;
  post_count: number;
};

export default function TrendingProjectsWidget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const supabase = supabaseBrowser();
      // Get projects with most posts in last 7 days
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .rpc("trending_projects", { since })
        .limit(5);
      if (!error && data) setProjects(data);
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

  if (!projects.length) {
    return (
      <div className="bg-white/5 rounded-xl border border-gray-800 p-5 mb-6">
        <div className="font-bold text-white mb-2 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-emerald-300" />
          Trending Projects
        </div>
        <div className="text-gray-400 text-sm">No trending projects yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl border border-gray-800 p-5 mb-6">
      <div className="font-bold text-white mb-2 flex items-center gap-2">
        <Rocket className="w-5 h-5 text-emerald-300" />
        Trending Projects
      </div>
      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            {p.cover_url ? (
              <img src={p.cover_url} alt={p.name} className="w-10 h-10 rounded object-cover border border-gray-700" />
            ) : (
              <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-emerald-300" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link href={`/projects/${p.slug}`} className="font-semibold text-white truncate hover:underline">
                {p.name}
              </Link>
              <div className="text-xs text-gray-400">{p.post_count} update{p.post_count === 1 ? "" : "s"} this week</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}