import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Chat from "../Chat";
import dynamic from "next/dynamic";

// Dynamically import CliqueUserList as a client component
const CliqueUserList = dynamic(() => import("./CliqueUserList"), { ssr: false });

export default async function CliquePage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServer();

  // Fetch clique by ID
  const { data: clique, error } = await supabase
    .from("cliques")
    .select("id, name, slug, description, is_private, owner_id, created_at")
    .eq("id", params.id)
    .single();

  if (error || !clique) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="p-8 text-gray-300">Clique not found.</div>
          </main>
        </div>
      </div>
    );
  }

  // 1) pull members (id + role)
  const { data: cm } = await supabase
    .from("clique_members")
    .select("user_id, role")
    .eq("clique_id", params.id);

  const userIds = (cm ?? []).map(m => m.user_id);
  // 2) pull profiles in bulk
  const { data: profs } = userIds.length
    ? await supabase
        .from("profiles")
        .select("user_id, handle, display_name, avatar_url")
        .in("user_id", userIds)
    : { data: [] as any[] };

  // 3) merge + sort (owner → moderator → member → alpha)
  const rank = (r?: string) => (r === "owner" ? 0 : r === "moderator" ? 1 : 2);
  const members = (cm ?? [])
    .map(m => ({
      user_id: m.user_id,
      role: m.role ?? "member",
      ...(profs?.find(p => p.user_id === m.user_id) ?? { handle: null, display_name: null, avatar_url: null })
    }))
    .sort((a, b) => rank(a.role) - rank(b.role) || (a.display_name ?? a.handle ?? "").localeCompare(b.display_name ?? b.handle ?? ""));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col px-4">
          {/* Title and description */}
          <div className="w-full max-w-2xl">
            <h1 className="text-4xl font-extrabold mb-2 text-white">{clique.name}</h1>
            {clique.description && (
              <p className="text-gray-300 text-lg mb-6">{clique.description}</p>
            )}
            <div className="mb-8 text-xs text-gray-500">
              Created: {new Date(clique.created_at).toLocaleString()}
            </div>
          </div>
          {/* Chat and members list side by side */}
          <div className="flex flex-row gap-8 w-full max-w-6xl">
            <div className="flex-1">
              <Chat cliqueId={clique.id} />
            </div>
            <div className="flex-shrink-0 flex flex-col justify-start">
              <CliqueUserList members={members} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}