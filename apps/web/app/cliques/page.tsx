import Sidebar from "../components/Sidebar";
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
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-row">
        <div className="flex-1 flex flex-col min-h-screen">
          <CliquesPageClient cliques={cliques ?? []} memberCounts={memberCounts} />
        </div>
        <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10">
          <RightSidebarWidgets />
        </aside>
      </div>
    </div>
  );
}