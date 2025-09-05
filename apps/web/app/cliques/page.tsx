import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import RightSidebarWidgets from "../components/RightSidebarWidgets";
import { createSupabaseServer } from "@/lib/supabase/server";
import { CliquesPageClient } from "./CliquesPageClient";

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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] w-full flex-1 md:ml-64">
            <div className="flex flex-col px-6 py-8">
              <div className="max-w-5xl w-full mx-auto">
                <CliquesPageClient cliques={cliques ?? []} memberCounts={memberCounts} />
              </div>
            </div>
            <aside className="hidden lg:block px-6 py-10 border-l border-gray-800">
              <RightSidebarWidgets />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}