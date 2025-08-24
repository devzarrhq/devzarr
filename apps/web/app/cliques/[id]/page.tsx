import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Chat from "../Chat";

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

  // Only render static content and Chat for now
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
            <Chat cliqueId={clique.id} />
          </div>
        </main>
      </div>
    </div>
  );
}