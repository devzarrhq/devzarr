import { createSupabaseServer } from "@/lib/supabase/server";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Chat from "../Chat";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import CliqueUserList as a client component
const CliqueUserList = dynamic(() => import("./CliqueUserList"), { ssr: false });

// Small client component for accent color
function CliqueTitle({
  name,
}: {
  name: string;
}) {
  "use client";
  const { accent } = require("../../theme-context").useTheme();
  return (
    <h1
      className="text-4xl font-extrabold mb-2"
      style={{ color: `var(--tw-color-accent-${accent})` }}
    >
      {name}
    </h1>
  );
}

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

  const members = (membersRaw ?? []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    handle: m.profiles?.handle ?? null,
    display_name: m.profiles?.display_name ?? null,
    avatar_url: m.profiles?.avatar_url ?? null,
  }));

  // Check if user is a member (server-side)
  let isMember = false;
  const cookieStore = cookies();
  const supabaseClient = createSupabaseServer();
  const { data: { user } = {} } = await supabaseClient.auth.getUser();
  if (user) {
    const { data: member } = await supabase
      .from("clique_members")
      .select("clique_id")
      .eq("clique_id", clique.id)
      .eq("user_id", user.id)
      .maybeSingle();
    isMember = !!member;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-row items-start py-10 gap-8">
          <div className="w-full max-w-2xl px-4">
            <Suspense fallback={<h1 className="text-4xl font-extrabold mb-2 text-gray-200">{clique.name}</h1>}>
              <CliqueTitle name={clique.name} />
            </Suspense>
            {clique.description && (
              <p className="text-gray-300 text-lg mb-6">{clique.description}</p>
            )}
            <div className="mb-8 text-xs text-gray-500">
              Created: {new Date(clique.created_at).toLocaleString()}
            </div>
            {!isMember ? (
              <JoinCliqueButton cliqueId={clique.id} />
            ) : (
              <Chat cliqueId={clique.id} />
            )}
          </div>
          <CliqueUserList members={members} />
        </main>
      </div>
    </div>
  );
}

// Client component for joining a clique
const JoinCliqueButton = dynamic(() => import("./JoinCliqueButton"), { ssr: false });