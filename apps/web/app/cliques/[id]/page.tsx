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

  // Fetch members (with profile and role)
  const { data: membersRaw } = await supabase
    .from("clique_members")
    .select("user_id, role, profiles:profiles(user_id, handle, display_name, avatar_url)")
    .eq("clique_id", clique.id);

  // Sanitize members: ensure all fields are serializable (no Date, no undefined, no functions)
  const members = (membersRaw ?? []).map((m: any) => ({
    user_id: m.user_id ? String(m.user_id) : "",
    role: m.role ? String(m.role) : "",
    handle: m.profiles?.handle ? String(m.profiles.handle) : null,
    display_name: m.profiles?.display_name ? String(m.profiles.display_name) : null,
    avatar_url: m.profiles?.avatar_url ? String(m.profiles.avatar_url) : null,
  }));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-row items-start py-10 gap-8">
          <div className="w-full max-w-2xl px-4">
            <h1 className="text-4xl font-extrabold mb-2 text-white">{clique.name}</h1>
            {clique.description && (
              <p className="text-gray-300 text-lg mb-6">{clique.description}</p>
            )}
            <div className="mb-8 text-xs text-gray-500">
              Created: {new Date(clique.created_at).toLocaleString()}
            </div>
            {/* Debug: Show raw members data */}
            <pre className="text-xs text-yellow-300 bg-black/50 p-2 rounded mb-4 max-w-full overflow-x-auto">
              {JSON.stringify(membersRaw, null, 2)}
            </pre>
            <Chat cliqueId={clique.id} />
          </div>
          <CliqueUserList members={members} />
        </main>
      </div>
    </div>
  );
}