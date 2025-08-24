import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default async function CliquesPage() {
  const supabase = createSupabaseServer();

  // Fetch all cliques and member counts
  const { data: cliques } = await supabase
    .from("cliques")
    .select("id, name, slug, description")
    .order("created_at", { ascending: false });

  // Fetch member counts for each clique
  let memberCounts: Record<string, number> = {};
  if (cliques && cliques.length > 0) {
    const cliqueIds = cliques.map((c) => c.id);
    const { data: members } = await supabase
      .from("clique_members")
      .select("clique_id, user_id");
    if (members) {
      for (const c of cliqueIds) {
        memberCounts[c] = members.filter((m) => m.clique_id === c).length;
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 py-10 px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-6 text-emerald-300">Cliques</h1>
          <CliquesSearch cliques={cliques ?? []} memberCounts={memberCounts} />
        </main>
      </div>
    </div>
  );
}

// Client component for search/filter
function CliquesSearch({ cliques, memberCounts }: { cliques: any[]; memberCounts: Record<string, number> }) {
  const [query, setQuery] = useState("");
  const filtered = cliques.filter((c) =>
    c.name?.toLowerCase().includes(query.toLowerCase()) ||
    c.slug?.toLowerCase().includes(query.toLowerCase()) ||
    c.description?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search cliques…"
        className="w-full mb-6 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-gray-400">No cliques found.</div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/cliques/${c.id}`}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-emerald-900/10 border border-gray-800 transition"
            >
              <Users className="w-8 h-8 text-emerald-300" />
              <div className="flex-1">
                <div className="font-semibold text-lg text-white">{c.name}</div>
                <div className="text-gray-400 text-sm">{c.description || c.slug}</div>
              </div>
              <div className="text-gray-300 text-sm">
                {memberCounts[c.id] ?? 0} member{(memberCounts[c.id] ?? 0) === 1 ? "" : "s"}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}