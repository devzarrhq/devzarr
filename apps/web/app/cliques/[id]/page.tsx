import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Chat from "../Chat";
import { cookies } from "next/headers";
import { useTheme } from "../../theme-context";
import dynamic from "next/dynamic";

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

  // Check if user is a member (server-side)
  let isMember = false;
  const cookieStore = cookies();
  const supabaseClient = createSupabaseServer();
  const { data: { session } = {} } = await supabaseClient.auth.getSession();
  if (session?.user) {
    const { data: member } = await supabase
      .from("clique_members")
      .select("clique_id")
      .eq("clique_id", clique.id)
      .eq("user_id", session.user.id)
      .maybeSingle();
    isMember = !!member;
  }

  // Accent color is client-side, so we use a CSS variable for the accent bar
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col items-center py-10">
          <div className="w-full max-w-2xl px-4">
            {/* Clique topic/title with accent bar */}
            <div className="flex items-center mb-2">
              <div
                className="w-2 h-10 rounded-full mr-4"
                style={{ background: "var(--tw-color-accent-blue)" }}
                id="clique-accent-bar"
              />
              <h1
                className="text-4xl font-extrabold text-left"
                style={{ color: "var(--tw-color-accent-blue)" }}
                id="clique-title"
              >
                {clique.name}
              </h1>
            </div>
            <div className="text-gray-400 mb-4">{clique.description}</div>
            <div className="mb-8 text-xs text-gray-500">
              Created: {new Date(clique.created_at).toLocaleString()}
            </div>
            {!isMember ? (
              <JoinCliqueButton cliqueId={clique.id} />
            ) : (
              <Chat cliqueId={clique.id} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Client component for joining a clique
const JoinCliqueButton = dynamic(() => import("./JoinCliqueButton"), { ssr: false });