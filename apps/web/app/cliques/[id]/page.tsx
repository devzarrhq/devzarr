"use client";
import { useTheme } from "../../theme-context";
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import Chat from "../Chat";
import { supabaseBrowser } from "@/lib/supabase/client";
import MembersClient from "./MembersClient";
import RightSidebarWidgets from "../../components/RightSidebarWidgets";
import { CliqueMembersProvider } from "./CliqueMembersContext";

export default function CliquePage({ params }: { params: { id: string } }) {
  const { accent } = useTheme();
  const [clique, setClique] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: cliqueData, error: cliqueError } = await supabase
          .from("cliques")
          .select("id, name, slug, description, is_private, owner_id, created_at, topic")
          .eq("id", params.id)
          .single();

        if (cliqueError || !cliqueData) {
          setError("Clique not found.");
          return;
        }
        setClique(cliqueData);

        const { data: cm } = await supabase
          .from("clique_members")
          .select("user_id, role, voice")
          .eq("clique_id", params.id);

        const userIds = (cm ?? []).map((m: any) => m.user_id);
        const { data: profs } = userIds.length
          ? await supabase
              .from("profiles")
              .select("user_id, handle, display_name, avatar_url")
              .in("user_id", userIds)
          : { data: [] as any[] };

        const rank = (r?: string) => (r === "owner" ? 0 : r === "moderator" ? 1 : 2);
        const mergedMembers = (cm ?? [])
          .map((m: any) => ({
            user_id: m.user_id,
            role: m.role ?? "member",
            voice: !!m.voice,
            ...(profs?.find((p: any) => p.user_id === m.user_id) ?? {
              handle: null,
              display_name: null,
              avatar_url: null,
            }),
          }))
          .sort(
            (a: any, b: any) =>
              rank(a.role) - rank(b.role) ||
              (a.display_name ?? a.handle ?? "").localeCompare(
                b.display_name ?? b.handle ?? ""
              )
          );
        setMembers(mergedMembers);
      } catch {
        setError("Failed to load clique.");
      }
    })();
  }, [params.id]);

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="p-8 text-gray-300">{error}</div>
          </main>
        </div>
      </div>
    );
  }

  if (!clique) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden md:ml-64">
          <Topbar />
          <main className="flex-1 flex items-center justify-center">
            <div className="p-8 text-gray-300">Loading…</div>
          </main>
        </div>
      </div>
    );
  }

return (
  <CliqueMembersProvider cliqueId={clique.id} initial={members}>
    <div className="flex h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />

      {/* Main column after Sidebar */}
      <div className="flex flex-1 flex-col h-screen">
        <Topbar />

        <div className="flex flex-1 flex-row min-h-0">
          {/* Center column */}
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px] min-h-0 px-4">
            <main className="w-full py-10 flex flex-col flex-1 min-h-0">
              <div className="mx-auto w-full max-w-5xl flex flex-col flex-1 min-h-0">
                {/* Title / Topic / Description */}
                <div className="mb-6">
                  <h1
                    className="text-4xl font-extrabold mb-2"
                    style={{ color: `var(--tw-color-accent-${accent})` }}
                  >
                    {clique.name}
                  </h1>
                  {clique.topic && (
                    <div className="mb-2 text-emerald-300 font-semibold text-lg">
                      Topic: {clique.topic}
                    </div>
                  )}
                  {clique.description && (
                    <p className="text-gray-300 text-lg mb-6">
                      {clique.description}
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {new Date(clique.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Chat + Members, constrained to remaining height */}
                <div className="flex-1 min-h-0 flex flex-row gap-8">
                  <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
                    <Chat cliqueId={clique.id} topic={clique.topic} />
                  </div>
                  <div className="flex-shrink-0 flex flex-col justify-start">
                    <MembersClient cliqueId={clique.id} />
                  </div>
                </div>
              </div>
            </main>
          </div>

          {/* Fixed right sidebar */}
          <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10 fixed right-0 top-0 h-full z-10">
            <RightSidebarWidgets />
          </aside>
        </div>
      </div>
    </div>
  </CliqueMembersProvider>
);

}
