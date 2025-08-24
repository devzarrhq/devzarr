import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import CliquesSearch from "./CliquesSearch";

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