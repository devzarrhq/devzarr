import { createSupabaseServer } from "@/lib/supabase/server";
import { CliquesPageClient } from "./CliquesPageClient";
import RightSidebarWidgets from "../components/RightSidebarWidgets";

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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <CliquesPageClient cliques={cliques ?? []} memberCounts={memberCounts} />
      <aside className="hidden lg:block lg:w-1/4 xl:w-1/5 px-4 py-8">
        <RightSidebarWidgets />
      </aside>
    </div>
  );
}